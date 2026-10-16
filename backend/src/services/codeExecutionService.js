// Secure Code Execution Service
// LinkTest Enterprise Isolated Sandbox Engine
// Spawns isolated child process with zero environment secrets, memory caps, and hard watchdog timeout.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNNER_PATH = path.resolve(__dirname, './sandboxRunner.js');

export const codeExecutionService = {
  /**
   * Securely runs JavaScript code against provided test cases in an isolated sandbox.
   *
   * @param {Object} params
   * @param {string} params.code - Student-submitted JavaScript code
   * @param {Array<Object>} params.testCases - [{ id, input, expected_output, is_hidden }]
   * @param {number} [params.timeLimitSeconds=2.0] - Time limit in seconds
   * @param {number} [params.memoryLimitMb=128] - Memory limit in megabytes
   * @returns {Promise<Object>} Execution result summary
   */
  async executeCode({ code, testCases = [], timeLimitSeconds = 2.0, memoryLimitMb = 128 }) {
    if (!code || typeof code !== 'string') {
      return {
        status: 'compilation_error',
        passed: false,
        score_percentage: 0,
        test_cases_passed: 0,
        total_test_cases: testCases.length,
        execution_time_ms: 0,
        memory_usage_mb: 0,
        error: 'No submitted code was provided for execution.',
        results: []
      };
    }

    const timeLimit = Math.max(0.5, Math.min(10.0, parseFloat(timeLimitSeconds) || 2.0));
    const memoryLimit = Math.max(32, Math.min(512, parseInt(memoryLimitMb, 10) || 128));

    // Watchdog timeout is total time limit for all test cases + 1000ms buffer
    const totalMaxMs = Math.max(1500, (testCases.length || 1) * (timeLimit * 1000) + 1000);

    return new Promise((resolve) => {
      let isSettled = false;

      // Spawn child process with EMPTY environment and memory limit
      const child = spawn(
        process.execPath,
        [
          `--max-old-space-size=${memoryLimit}`,
          '--no-warnings',
          RUNNER_PATH
        ],
        {
          // Pass empty environment object: NO process.env secrets, NO DB credentials, NO keys
          env: {},
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      let stdoutData = '';
      let stderrData = '';

      // Hard watchdog timer to force kill runaway child processes
      const watchdog = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            child.kill('SIGKILL');
          } catch (e) {}

          resolve({
            status: 'timeout',
            passed: false,
            score_percentage: 0,
            test_cases_passed: 0,
            total_test_cases: testCases.length,
            execution_time_ms: Math.round(totalMaxMs),
            memory_usage_mb: 0,
            error: `Execution timed out: Exceeded sandbox CPU ceiling (> ${timeLimit}s per test case).`,
            results: testCases.map((tc, idx) => ({
              test_case_id: tc.id || `tc-${idx + 1}`,
              is_hidden: Boolean(tc.is_hidden),
              passed: false,
              execution_time_ms: Math.round(timeLimit * 1000),
              error: 'Time Limit Exceeded'
            }))
          });
        }
      }, totalMaxMs);

      child.stdout.on('data', chunk => {
        if (stdoutData.length < 200000) {
          stdoutData += chunk.toString();
        }
      });

      child.stderr.on('data', chunk => {
        if (stderrData.length < 50000) {
          stderrData += chunk.toString();
        }
      });

      child.on('error', err => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(watchdog);
          resolve({
            status: 'runtime_error',
            passed: false,
            score_percentage: 0,
            test_cases_passed: 0,
            total_test_cases: testCases.length,
            execution_time_ms: 0,
            memory_usage_mb: 0,
            error: `Failed to initialize isolated execution worker: ${err.message}`,
            results: []
          });
        }
      });

      child.on('close', codeExit => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(watchdog);

          if (codeExit !== 0 && !stdoutData.trim()) {
            return resolve({
              status: 'runtime_error',
              passed: false,
              score_percentage: 0,
              test_cases_passed: 0,
              total_test_cases: testCases.length,
              execution_time_ms: 0,
              memory_usage_mb: 0,
              error: stderrData.trim() || `Process exited with error code ${codeExit}`,
              results: []
            });
          }

          try {
            const parsed = JSON.parse(stdoutData.trim());
            resolve(parsed);
          } catch (parseErr) {
            resolve({
              status: 'runtime_error',
              passed: false,
              score_percentage: 0,
              test_cases_passed: 0,
              total_test_cases: testCases.length,
              execution_time_ms: 0,
              memory_usage_mb: 0,
              error: stderrData.trim() || 'Invalid response from execution sandbox.',
              results: []
            });
          }
        }
      });

      // Send payload via stdin and close stream
      const payload = JSON.stringify({
        code,
        testCases,
        timeLimitSeconds: timeLimit
      });

      try {
        child.stdin.write(payload);
        child.stdin.end();
      } catch (err) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(watchdog);
          resolve({
            status: 'runtime_error',
            passed: false,
            score_percentage: 0,
            test_cases_passed: 0,
            total_test_cases: testCases.length,
            execution_time_ms: 0,
            memory_usage_mb: 0,
            error: `Failed to write code payload to sandbox: ${err.message}`,
            results: []
          });
        }
      }
    });
  },

  /**
   * Sanitizes test results so that hidden test cases do not reveal their input or expected output.
   * Safe to return directly to students.
   */
  sanitizeResultsForCandidate(executionData) {
    if (!executionData) return null;
    const sanitizedResults = (executionData.results || []).map(r => {
      if (r.is_hidden) {
        return {
          test_case_id: r.test_case_id,
          is_hidden: true,
          passed: r.passed,
          execution_time_ms: r.execution_time_ms,
          error: r.passed ? undefined : 'Hidden Test Case Failed'
        };
      }
      return {
        test_case_id: r.test_case_id,
        is_hidden: false,
        passed: r.passed,
        execution_time_ms: r.execution_time_ms,
        input: r.input,
        expected_output: r.expected_output,
        actual_output: r.actual_output,
        error: r.error
      };
    });

    return {
      status: executionData.status,
      passed: executionData.passed,
      score_percentage: executionData.score_percentage,
      test_cases_passed: executionData.test_cases_passed,
      total_test_cases: executionData.total_test_cases,
      execution_time_ms: executionData.execution_time_ms,
      memory_usage_mb: executionData.memory_usage_mb,
      error: executionData.error,
      results: sanitizedResults
    };
  }
};
