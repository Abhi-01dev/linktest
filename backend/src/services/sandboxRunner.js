// LinkTest Isolated Sandbox Runner
// Executes user-submitted code in an isolated child process with zero environment secrets,
// restricted globals, no filesystem/network access, and memory/time constraints.

import vm from 'vm';
import { performance } from 'perf_hooks';

// Ensure standard dangerous modules are eradicated from this isolated process
const dangerousModules = ['fs', 'child_process', 'net', 'http', 'https', 'tls', 'dgram', 'cluster', 'dns', 'inspector'];
dangerousModules.forEach(mod => {
  try {
    delete require.cache[require.resolve(mod)];
  } catch (e) {
    // Ignore if not loaded
  }
});

// Read execution payload from stdin
let rawInput = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
  rawInput += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(rawInput);
    const result = execute(payload);
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      error: err.message || 'Execution setup failure',
      results: []
    }));
    process.exit(0);
  }
});

function parseInputArgs(inputStr, targetFn) {
  if (inputStr === undefined || inputStr === null) return [];
  const trimmed = String(inputStr).trim();
  if (!trimmed) return [];

  // Try JSON parsing first (e.g. [2, 3] or "hello" or {"a": 1})
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    // If target function only expects 1 argument, keep string intact (don't split sentences)
    if (targetFn && typeof targetFn === 'function' && targetFn.length <= 1) {
      return [trimmed];
    }
    // If multiple space-separated or line-separated values
    const parts = trimmed.split(/[\s,]+/);
    return parts.map(p => {
      const num = Number(p);
      return !isNaN(num) ? num : p;
    });
  }
}

function normalizeOutput(val) {
  if (val === undefined) return '';
  if (val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val).trim();
}

function outputsMatch(actual, expected) {
  const normActual = normalizeOutput(actual).trim();
  const normExpected = String(expected ?? '').trim();

  if (normActual === normExpected) return true;

  // Try numerical comparison
  const numA = parseFloat(normActual);
  const numE = parseFloat(normExpected);
  if (!isNaN(numA) && !isNaN(numE) && Math.abs(numA - numE) < 0.0001) {
    return true;
  }

  // Try JSON comparison (object / array structure)
  try {
    const jsonA = JSON.parse(normActual);
    const jsonE = JSON.parse(normExpected);
    if (JSON.stringify(jsonA) === JSON.stringify(jsonE)) {
      return true;
    }
  } catch {}

  return false;
}

function execute({ code, testCases = [], timeLimitSeconds = 2.0 }) {
  const timeLimitMs = Math.max(200, Math.min(10000, Math.round((timeLimitSeconds || 2.0) * 1000)));
  const results = [];
  let totalTimeMs = 0;
  let maxMemoryMb = 0;
  let overallPassed = true;
  let overallStatus = 'passed';
  let firstError = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const isHidden = Boolean(tc.is_hidden);
    const tcId = tc.id || `tc-${i + 1}`;
    const tcInput = tc.input ?? '';
    const tcExpected = tc.expected_output ?? '';

    // Logs captured per test case
    const logs = [];
    let logCharCount = 0;
    const MAX_LOG_CHARS = 4000;

    const safeConsole = {
      log: (...args) => {
        if (logCharCount < MAX_LOG_CHARS) {
          const str = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
          logs.push(str);
          logCharCount += str.length;
        }
      },
      info: (...args) => safeConsole.log(...args),
      warn: (...args) => safeConsole.log(...args),
      error: (...args) => safeConsole.log(...args)
    };

    // Create a pristine, isolated sandbox
    const sandbox = {
      console: safeConsole,
      Math,
      Date,
      String,
      Number,
      Boolean,
      Array,
      Object,
      JSON,
      RegExp,
      Set,
      Map,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURI,
      decodeURI,
      encodeURIComponent,
      decodeURIComponent,
      Infinity,
      NaN,
      undefined
    };

    // Make sure global points to sandbox, and strip dangerous globals
    sandbox.global = sandbox;
    sandbox.globalThis = sandbox;

    const context = vm.createContext(sandbox);

    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();
    let actualOutput = '';
    let testPassed = false;
    let tcError = null;

    try {
      // 1. Run the student's code inside the VM context with timeout
      const script = new vm.Script(code, {
        filename: 'student_solution.js',
        displayErrors: true
      });

      const scriptResult = script.runInContext(context, {
        timeout: timeLimitMs,
        microtaskMode: 'afterEvaluate'
      });

      // 2. Determine execution invocation:
      // Check if user defined a function (e.g., function sum, twoSum, solve, etc.)
      const declaredFunctions = Object.keys(sandbox).filter(
        k => typeof sandbox[k] === 'function' && !Object.prototype.hasOwnProperty.call(Math, k) && !['parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent'].includes(k)
      );

      if (declaredFunctions.length > 0) {
        // Prefer function that matches starter code or first custom function
        const targetFn = sandbox[declaredFunctions[declaredFunctions.length - 1]];
        const parsedArgs = parseInputArgs(tcInput, targetFn);
        const fnResult = targetFn(...parsedArgs);

        if (fnResult !== undefined) {
          actualOutput = normalizeOutput(fnResult);
        } else if (logs.length > 0) {
          actualOutput = logs.join('\n').trim();
        } else {
          actualOutput = '';
        }
      } else if (scriptResult !== undefined) {
        actualOutput = normalizeOutput(scriptResult);
      } else if (logs.length > 0) {
        actualOutput = logs.join('\n').trim();
      }

      testPassed = outputsMatch(actualOutput, tcExpected);
    } catch (err) {
      testPassed = false;
      const isTimeout = err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || err.message?.includes('timed out');
      const isMemory = err.message?.includes('out of memory') || err.message?.includes('allocation failed') || err.message?.includes('Maximum call stack');
      tcError = isTimeout ? 'TIME_LIMIT_EXCEEDED' : (isMemory ? 'MEMORY_LIMIT_EXCEEDED' : (err.message || 'Runtime Error'));

      if (!firstError) {
        firstError = tcError;
        overallStatus = isTimeout ? 'TIME_LIMIT_EXCEEDED' : (isMemory ? 'MEMORY_LIMIT_EXCEEDED' : 'runtime_error');
      }
    }

    const duration = Math.round(performance.now() - start);
    const memAfter = process.memoryUsage().heapUsed;
    const memMb = parseFloat(Math.max(0, (memAfter - memBefore) / (1024 * 1024)).toFixed(2));

    totalTimeMs += duration;
    if (memMb > maxMemoryMb) maxMemoryMb = memMb;

    if (!testPassed && overallPassed) {
      overallPassed = false;
      if (overallStatus === 'passed') {
        overallStatus = 'failed';
      }
    }

    results.push({
      test_case_id: tcId,
      is_hidden: isHidden,
      passed: testPassed,
      execution_time_ms: duration,
      // For public test cases, provide input, expected, and actual output
      // For hidden test cases, omit these to prevent leaking test data
      input: isHidden ? undefined : tcInput,
      expected_output: isHidden ? undefined : tcExpected,
      actual_output: isHidden ? undefined : actualOutput,
      error: isHidden && !tcError ? undefined : tcError
    });
  }

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return {
    status: overallStatus,
    passed: overallPassed,
    score_percentage: totalCount > 0 ? parseFloat(((passedCount / totalCount) * 100).toFixed(1)) : 0,
    test_cases_passed: passedCount,
    total_test_cases: totalCount,
    execution_time_ms: totalTimeMs,
    memory_usage_mb: maxMemoryMb,
    error: firstError,
    results
  };
}
