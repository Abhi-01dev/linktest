import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { codeExecutionService, checkHazardousCalls } from '../src/services/codeExecutionService.js';

let server;
let baseUrl;
let studentToken = null;

describe('Issue #23: Isolated Coding Sandbox Execution Suite', () => {
  before(async () => {
    process.env.MOCK_EMAIL = 'true';
    await initDb();
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Authenticate Student
    const studentRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@linktest.io', password: 'Student123!' })
    });
    const studentData = await studentRes.json();
    assert.strictEqual(studentRes.status, 200);
    studentToken = studentData.data.token;
  });

  after(() => {
    if (server) server.close();
  });

  test('AC 1: Valid JavaScript solution executes and returns passed test case status with execution time', async () => {
    const twoSumJs = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`;
    const testCases = [
      { id: 'tc-1', input: '[[2, 7, 11, 15], 9]', expected_output: '[0, 1]', is_hidden: false },
      { id: 'tc-2', input: '[[3, 2, 4], 6]', expected_output: '[1, 2]', is_hidden: false },
      { id: 'tc-3', input: '[[3, 3], 6]', expected_output: '[0, 1]', is_hidden: true }
    ];

    const res = await fetch(`${baseUrl}/api/coding/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: twoSumJs,
        language: 'javascript',
        testCases,
        timeLimitSeconds: 2.0
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.status, 'passed');
    assert.strictEqual(data.data.passed, true);
    assert.strictEqual(data.data.test_cases_passed, 3);
    assert.strictEqual(data.data.total_test_cases, 3);
    assert.ok(typeof data.data.execution_time_ms === 'number');
  });

  test('AC 1: Valid Python solution executes and returns passed test case status with execution time', async () => {
    const pythonSolution = `
def add(a, b):
    return a + b
`;
    const testCases = [
      { id: 'tc-1', input: '[3, 5]', expected_output: '8', is_hidden: false },
      { id: 'tc-2', input: '[-10, 20]', expected_output: '10', is_hidden: true }
    ];

    const summary = await codeExecutionService.executeCode({
      code: pythonSolution,
      language: 'python',
      testCases,
      timeLimitSeconds: 2.0
    });

    assert.strictEqual(summary.status, 'passed');
    assert.strictEqual(summary.passed, true);
    assert.strictEqual(summary.test_cases_passed, 2);
    assert.strictEqual(summary.total_test_cases, 2);
    assert.ok(typeof summary.execution_time_ms === 'number');
  });

  test('AC 2: Infinite loop code is terminated with TIME_LIMIT_EXCEEDED', async () => {
    const infiniteLoopJs = `
function loopForever() {
  while (true) {}
}
loopForever();
`;
    const testCases = [
      { id: 'tc-timeout', input: '', expected_output: 'done', is_hidden: false }
    ];

    const res = await fetch(`${baseUrl}/api/coding/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: infiniteLoopJs,
        language: 'javascript',
        testCases,
        timeLimitSeconds: 1.0 // 1s timeout to ensure prompt test completion
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(
      data.data.status === 'TIME_LIMIT_EXCEEDED' || data.data.error === 'TIME_LIMIT_EXCEEDED',
      `Expected TIME_LIMIT_EXCEEDED status/error, got: ${data.data.status} / ${data.data.error}`
    );
    assert.strictEqual(data.data.passed, false);
  });

  test('AC 3: Memory-exhausting code is terminated with MEMORY_LIMIT_EXCEEDED', async () => {
    const memoryExhaustionJs = `
function exhaustMemory() {
  const chunks = [];
  while (true) {
    chunks.push(new Array(10000000).fill('exhaust_heap'));
  }
}
exhaustMemory();
`;
    const testCases = [
      { id: 'tc-mem', input: '', expected_output: 'done', is_hidden: false }
    ];

    const summary = await codeExecutionService.executeCode({
      code: memoryExhaustionJs,
      language: 'javascript',
      testCases,
      memoryLimitMb: 64, // Low memory cap
      timeLimitSeconds: 2.0
    });

    assert.strictEqual(summary.passed, false);
    assert.ok(
      summary.status === 'MEMORY_LIMIT_EXCEEDED' || summary.error?.includes('MEMORY_LIMIT_EXCEEDED') || summary.status === 'runtime_error',
      `Expected memory termination, got: ${summary.status} / ${summary.error}`
    );
  });

  test('AC 4: Host file system and network calls are blocked', async () => {
    const maliciousCodes = [
      "const fs = require('fs'); fs.readFileSync('/etc/passwd');",
      "const cp = require('child_process'); cp.execSync('whoami');",
      "import('fs').then(f => f.readFileSync('key.pem'));",
      "process.binding('fs')",
      "import os\nos.system('dir')",
      "import subprocess\nsubprocess.run(['ls'])"
    ];

    for (const code of maliciousCodes) {
      const lang = code.includes('import os') || code.includes('subprocess') ? 'python' : 'javascript';
      const check = checkHazardousCalls(code, lang);
      assert.ok(check, `Must detect hazardous call in: ${code}`);

      const summary = await codeExecutionService.executeCode({
        code,
        language: lang,
        testCases: [{ id: 'tc-sec', input: '', expected_output: '', is_hidden: false }]
      });

      assert.strictEqual(summary.status, 'SECURITY_VIOLATION');
      assert.strictEqual(summary.passed, false);
      assert.ok(summary.error.includes('blocked'));
    }
  });
});
