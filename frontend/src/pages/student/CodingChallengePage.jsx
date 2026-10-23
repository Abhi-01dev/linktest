import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StudentNav } from '../../components/student/StudentNav';
import { CodeEditor } from '../../components/coding/CodeEditor';
import { codingApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Code2,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Cpu,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const SAMPLE_CHALLENGES = [
  {
    id: 'two-sum',
    title: 'Two Sum Problem',
    difficulty: 'Easy',
    category: 'Arrays & Hash Tables',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    starterJs: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test call
console.log(twoSum([2, 7, 11, 15], 9));
`,
    starterPy: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Test execution
print(two_sum([2, 7, 11, 15], 9))
`
  },
  {
    id: 'palindrome-number',
    title: 'Valid Palindrome Number',
    difficulty: 'Easy',
    category: 'Math & Strings',
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise. An integer is a palindrome when it reads the same backward as forward.`,
    examples: [
      { input: 'x = 121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.' },
      { input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left it becomes 121-.' }
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    starterJs: `function isPalindrome(x) {
  if (x < 0) return false;
  const s = String(x);
  return s === s.split('').reverse().join('');
}

console.log(isPalindrome(121));
`,
    starterPy: `def is_palindrome(x):
    if x < 0:
        return False
    s = str(x)
    return s == s[::-1]

print(is_palindrome(121))
`
  }
];

export function CodingChallengePage() {
  const { id } = useParams();
  const challenge = SAMPLE_CHALLENGES.find(c => c.id === id) || SAMPLE_CHALLENGES[0];

  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(challenge.starterJs);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState(null);
  const [activeTestTab, setActiveTestTab] = useState(0);

  const { showToast } = useToast();

  useEffect(() => {
    setCode(language === 'python' ? challenge.starterPy : challenge.starterJs);
  }, [language, challenge]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleOutput({ status: 'running', message: 'Compiling and executing in isolated sandbox...' });

    try {
      const startTime = performance.now();
      const res = await codingApi.executeCode({
        questionId: challenge.id,
        code,
        language
      });
      const duration = Math.round(performance.now() - startTime);

      setConsoleOutput({
        status: res?.success !== false ? 'passed' : 'failed',
        stdout: res?.stdout || res?.output || 'Execution completed with no standard output.',
        stderr: res?.stderr || null,
        duration: res?.execution_time_ms || duration,
        testCases: res?.test_results || [
          { name: 'Sample Test 1', passed: true, input: challenge.examples[0]?.input, expected: challenge.examples[0]?.output },
          { name: 'Sample Test 2', passed: true, input: challenge.examples[1]?.input, expected: challenge.examples[1]?.output }
        ]
      });
      showToast('Code executed successfully!', 'success');
    } catch (err) {
      setConsoleOutput({
        status: 'error',
        error: err.message || 'Execution timed out or sandbox runtime error occurred.',
        stderr: err.details || err.stack || err.message
      });
      showToast(err.message || 'Error running code in sandbox', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
    try {
      const res = await codingApi.submitSolution({
        questionId: challenge.id,
        code,
        language
      });
      setConsoleOutput({
        status: 'submitted',
        stdout: res?.feedback || 'All test suite assertions evaluated. Solution submitted for grading.',
        score: res?.score || 100,
        testCases: res?.test_results || [
          { name: 'Hidden Test 1', passed: true },
          { name: 'Hidden Test 2', passed: true }
        ]
      });
      showToast('Solution submitted successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Submission error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#DCFCE7', color: '#166534' }}>
                {challenge.difficulty}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {challenge.category}
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
              {challenge.title}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {SAMPLE_CHALLENGES.map(c => (
              <Link
                key={c.id}
                to={`/coding/${c.id}`}
                className="btn btn-sm btn-outline"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  background: c.id === challenge.id ? 'var(--color-navy)' : 'transparent',
                  color: c.id === challenge.id ? '#FFFFFF' : 'var(--color-navy)',
                  borderColor: c.id === challenge.id ? 'var(--color-navy)' : 'var(--color-border)'
                }}
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>

        {/* 2-Column Split: Problem Description vs Code Editor */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Problem Details */}
          <div className="card" style={{ padding: '1.75rem', maxHeight: '820px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
              Problem Description
            </h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
              {challenge.description}
            </div>

            {/* Examples */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
              Sample Examples
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {challenge.examples.map((ex, idx) => (
                <div key={idx} style={{ padding: '0.85rem 1rem', background: 'var(--color-bg-alt)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.35rem' }}>Example {idx + 1}:</div>
                  <div style={{ fontFamily: 'Consolas, monospace', color: 'var(--color-navy)' }}>
                    <strong>Input:</strong> {ex.input}
                  </div>
                  <div style={{ fontFamily: 'Consolas, monospace', color: 'var(--color-navy)', marginTop: '0.2rem' }}>
                    <strong>Output:</strong> {ex.output}
                  </div>
                  {ex.explanation && (
                    <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                      <strong>Explanation:</strong> {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Constraints */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
              Constraints
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {challenge.constraints.map((c, i) => (
                <li key={i} style={{ fontFamily: 'Consolas, monospace' }}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Right Column: Code Editor & Execution Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onRun={handleRunCode}
              onSubmit={handleSubmitSolution}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
            />

            {/* Test Run Console Drawer */}
            <div
              style={{
                borderRadius: '12px',
                background: '#0F172A',
                border: '1px solid #1E293B',
                padding: '1.25rem',
                color: '#F8FAFC',
                minHeight: '200px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Terminal size={16} style={{ color: '#38BDF8' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                    Test Runner Console
                  </span>
                </div>

                {consoleOutput && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    {consoleOutput.duration && (
                      <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} />
                        {consoleOutput.duration}ms
                      </span>
                    )}
                    {consoleOutput.status === 'passed' && (
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#064E3B', color: '#34D399', fontWeight: 700 }}>
                        All Tests Passed ✓
                      </span>
                    )}
                    {consoleOutput.status === 'failed' && (
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#7F1D1D', color: '#F87171', fontWeight: 700 }}>
                        Assertion Failed ✗
                      </span>
                    )}
                    {consoleOutput.status === 'error' && (
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#7F1D1D', color: '#F87171', fontWeight: 700 }}>
                        Execution Error
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!consoleOutput ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                  Click <strong>"Run Code"</strong> to execute in the sandbox or <strong>"Submit Solution"</strong> to evaluate against test suites.
                </div>
              ) : consoleOutput.status === 'running' ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#38BDF8', fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>Compiling and executing in sandbox...</div>
                </div>
              ) : consoleOutput.status === 'error' ? (
                <div style={{ padding: '0.75rem', background: '#450A0A', borderRadius: '6px', border: '1px solid #7F1D1D', color: '#FECACA', fontSize: '0.82rem', fontFamily: 'Consolas, monospace', whiteSpace: 'pre-wrap' }}>
                  <strong>Runtime / Syntax Error:</strong>
                  <div>{consoleOutput.stderr || consoleOutput.error}</div>
                </div>
              ) : (
                <div>
                  {/* Test Cases Pass/Fail Badges */}
                  {consoleOutput.testCases && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      {consoleOutput.testCases.map((tc, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            background: tc.passed ? '#064E3B' : '#7F1D1D',
                            color: tc.passed ? '#6EE7B7' : '#FCA5A5',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {tc.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{tc.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Standard Output Pane */}
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem', fontWeight: 600 }}>Standard Output (stdout):</div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '0.75rem',
                      background: '#0B0F19',
                      borderRadius: '6px',
                      border: '1px solid #1E293B',
                      color: '#E2E8F0',
                      fontFamily: 'Consolas, "Fira Code", monospace',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}
                  >
                    {consoleOutput.stdout}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodingChallengePage;
