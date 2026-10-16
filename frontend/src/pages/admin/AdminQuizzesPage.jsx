import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { BulkQuestionImportModal } from '../../components/questions/BulkQuestionImportModal';
import { QuestionBankSelectorModal } from '../../components/questions/QuestionBankSelectorModal';

export function AdminQuizzesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      question_text: 'What is the primary role of indexing in a relational database?',
      question_type: 'mcq_single',
      options: [
        'To reduce disk storage requirements',
        'To significantly speed up data query retrieval at the cost of slower writes',
        'To prevent unauthorized SQL queries',
        'To automatically back up database tables'
      ],
      correct_option_index: 1,
      explanation: 'Indexes create efficient lookup data structures (like B-trees) that enable fast logarithmic search times for SELECT queries, while introducing modest overhead for INSERT/UPDATE operations.',
      marks: 1,
      expected_answer: '',
      evaluation_criteria: '',
      programming_language: 'javascript',
      starter_code: '',
      time_limit: 2,
      memory_limit: 128,
      test_cases: []
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const handleBulkImportSuccess = (importedList) => {
    if (Array.isArray(importedList) && importedList.length > 0) {
      const mapped = importedList.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type || q.questionType || 'mcq_single',
        options: Array.isArray(q.options) ? q.options : (String(q.question_type || '').includes('true_false') ? ['True', 'False'] : ['', '', '', '']),
        correct_option_index: q.correct_option_index ?? 0,
        explanation: q.explanation || '',
        marks: parseFloat(q.marks) || 1,
        expected_answer: q.expected_answer || '',
        evaluation_criteria: q.evaluation_criteria || '',
        programming_language: q.programming_language || 'javascript',
        starter_code: q.starter_code || '',
        time_limit: q.time_limit || 2,
        memory_limit: q.memory_limit || 128,
        test_cases: q.test_cases || []
      }));
      setQuestions(prev => [...prev, ...mapped]);
      showToast(`Appended ${mapped.length} imported questions to quiz.`, 'success');
    }
  };

  const handleBankSelect = (selectedList) => {
    if (Array.isArray(selectedList) && selectedList.length > 0) {
      const mapped = selectedList.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type || q.questionType || 'mcq_single',
        options: Array.isArray(q.options) ? q.options : (String(q.question_type || '').includes('true_false') ? ['True', 'False'] : ['', '', '', '']),
        correct_option_index: q.correct_option_index ?? 0,
        explanation: q.explanation || '',
        marks: parseFloat(q.marks) || 1,
        expected_answer: q.expected_answer || '',
        evaluation_criteria: q.evaluation_criteria || '',
        programming_language: q.programming_language || 'javascript',
        starter_code: q.starter_code || '',
        time_limit: q.time_limit || 2,
        memory_limit: q.memory_limit || 128,
        test_cases: q.test_cases || []
      }));
      setQuestions(prev => [...prev, ...mapped]);
      showToast(`Added ${mapped.length} questions from Question Bank.`, 'success');
    }
  };

  useEffect(() => {
    async function loadCourses() {
      try {
        const list = await api.getCourses({ published: 'all' });
        setCourses(list);
        if (list.length > 0) {
          setCourseId(list[0].id);
        }
      } catch (err) {
        showToast('Failed to load courses', 'error');
      }
    }
    loadCourses();
  }, []);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question_text: '',
        question_type: 'mcq_single',
        options: ['', '', '', ''],
        correct_option_index: 0,
        explanation: '',
        marks: 1,
        expected_answer: '',
        evaluation_criteria: '',
        programming_language: 'javascript',
        starter_code: '// Write solution here\nfunction solution() {\n  \n}',
        time_limit: 2,
        memory_limit: 128,
        test_cases: [
          { input: '', expected_output: '', is_hidden: false }
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      showToast('A quiz must contain at least one question.', 'warning');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionFieldChange = (idx, field, val) => {
    setQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      if (field === 'question_type') {
        const t = String(val).toLowerCase();
        if (t.includes('true_false')) {
          next[idx].options = ['True', 'False'];
          next[idx].correct_option_index = 0;
        } else if (t.includes('mcq') && (!next[idx].options || next[idx].options.length < 2)) {
          next[idx].options = ['', '', '', ''];
          next[idx].correct_option_index = 0;
        } else if (t.includes('coding') && (!next[idx].starter_code)) {
          next[idx].starter_code = '// Write your solution here\nfunction solution(input) {\n  return input;\n}';
          if (!next[idx].test_cases || next[idx].test_cases.length === 0) {
            next[idx].test_cases = [{ input: '', expected_output: '', is_hidden: false }];
          }
        }
      }
      return next;
    });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    setQuestions(prev => {
      const next = [...prev];
      const nextOptions = [...(next[qIdx].options || [])];
      nextOptions[optIdx] = val;
      next[qIdx].options = nextOptions;
      return next;
    });
  };

  const handleCorrectOptionChange = (qIdx, optIdx) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx].correct_option_index = optIdx;
      return next;
    });
  };

  const handleAddTestCase = (qIdx) => {
    setQuestions(prev => {
      const next = [...prev];
      const tcs = [...(next[qIdx].test_cases || [])];
      tcs.push({ input: '', expected_output: '', is_hidden: false });
      next[qIdx].test_cases = tcs;
      return next;
    });
  };

  const handleRemoveTestCase = (qIdx, tcIdx) => {
    setQuestions(prev => {
      const next = [...prev];
      const tcs = [...(next[qIdx].test_cases || [])];
      next[qIdx].test_cases = tcs.filter((_, i) => i !== tcIdx);
      return next;
    });
  };

  const handleTestCaseChange = (qIdx, tcIdx, field, val) => {
    setQuestions(prev => {
      const next = [...prev];
      const tcs = [...(next[qIdx].test_cases || [])];
      tcs[tcIdx] = { ...tcs[tcIdx], [field]: val };
      next[qIdx].test_cases = tcs;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !courseId) {
      showToast('Please select a course and enter a quiz title.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const quiz = await api.createQuiz({
        courseId,
        title,
        description,
        questions
      });
      showToast('New assessment created successfully!', 'success');
      navigate('/admin');
    } catch (err) {
      showToast(err.message || 'Failed to create assessment', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Link
            to="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              marginBottom: '0.25rem'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Admin Overview</span>
          </Link>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            Assessment & Quiz Creator
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
            Construct multiple-choice evaluations with server-calculated scoring and educational explanations.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Metadata Card */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Quiz Details</h3>

            <div className="form-group">
              <label className="form-label">Associate with Course</label>
              <select
                className="form-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quiz Title</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Relational Database & SQL Indexing Assessment"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quiz Description</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of syllabus objectives tested..."
              />
            </div>
          </div>

          {/* Question Builder */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', margin: 0 }}>Questions ({questions.length})</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setBankModalOpen(true)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Layers size={14} />
                  <span>From Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#2563EB', borderColor: '#BFDBFE' }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Bulk Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn btn-outline btn-sm"
                >
                  <Plus size={14} />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {questions.map((q, qIdx) => {
                const qType = String(q.question_type || 'mcq_single').toLowerCase();
                const isCoding = qType.includes('coding');
                const isLongAnswer = qType.includes('long_answer') || qType.includes('long-answer');
                const isTrueFalse = qType.includes('true_false') || qType.includes('true-false');
                const options = Array.isArray(q.options) ? q.options : [];
                const testCases = Array.isArray(q.test_cases) ? q.test_cases : [];

                return (
                  <div key={qIdx} className="card" style={{ padding: '2rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-orange-dark)', textTransform: 'uppercase' }}>
                          Question #{qIdx + 1}
                        </span>
                        {/* Question Type Selector */}
                        <select
                          value={q.question_type || 'mcq_single'}
                          onChange={(e) => handleQuestionFieldChange(qIdx, 'question_type', e.target.value)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            background: isCoding ? '#EEF2FF' : isLongAnswer ? '#FEF3C7' : isTrueFalse ? '#CCFBF1' : '#F1F5F9',
                            color: isCoding ? '#4338CA' : isLongAnswer ? '#92400E' : isTrueFalse ? '#0F766E' : '#334155'
                          }}
                        >
                          <option value="mcq_single">Multiple Choice</option>
                          <option value="true_false">True / False</option>
                          <option value="long_answer">Long Answer</option>
                          <option value="coding">Coding Question</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Marks:
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={q.marks || 1}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'marks', parseFloat(e.target.value) || 1)}
                            style={{ width: '50px', padding: '0.2rem 0.35rem', fontSize: '0.78rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                          />
                        </label>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Question Text / Prompt</label>
                      <input
                        type="text"
                        className="form-input"
                        value={q.question_text}
                        onChange={(e) => handleQuestionFieldChange(qIdx, 'question_text', e.target.value)}
                        required
                        placeholder={isCoding ? "e.g. Write a function reverseString(str) that returns the reversed string." : isLongAnswer ? "e.g. Explain how indexing impacts query performance and storage." : "e.g. Which data structure provides O(1) average lookup?"}
                      />
                    </div>

                    {/* MCQ Options */}
                    {!isCoding && !isLongAnswer && !isTrueFalse && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                          Options (Select the radio corresponding to the correct answer)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {options.map((opt, optIdx) => (
                            <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <input
                                type="radio"
                                name={`correct-opt-${qIdx}`}
                                checked={q.correct_option_index === optIdx}
                                onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                                style={{ width: 18, height: 18, accentColor: 'var(--color-orange)', cursor: 'pointer' }}
                                title="Mark as correct answer"
                              />
                              <input
                                type="text"
                                className="form-input"
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                required
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* True / False Options */}
                    {isTrueFalse && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                          Select the correct statement truth value:
                        </label>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          {['True', 'False'].map((label, optIdx) => (
                            <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                              <input
                                type="radio"
                                name={`correct-opt-${qIdx}`}
                                checked={q.correct_option_index === optIdx}
                                onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                                style={{ width: 18, height: 18, accentColor: '#0D9488' }}
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Long Answer Reference & Rubric */}
                    {isLongAnswer && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label className="form-label">Expected Answer / Key Concepts</label>
                          <textarea
                            className="form-textarea"
                            rows={3}
                            value={q.expected_answer || ''}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'expected_answer', e.target.value)}
                            placeholder="Detailed model answer used by instructors during manual review..."
                          />
                        </div>
                        <div>
                          <label className="form-label">Grading Criteria / Rubric</label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            value={q.evaluation_criteria || ''}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'evaluation_criteria', e.target.value)}
                            placeholder="e.g. 50% for correct technical explanation, 30% for real-world example, 20% for conciseness."
                          />
                        </div>
                      </div>
                    )}

                    {/* Coding Question Configuration */}
                    {isCoding && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Programming Language</label>
                            <input
                              type="text"
                              className="form-input"
                              disabled
                              value="JavaScript (Node.js Sandbox)"
                              style={{ background: '#F8FAFC' }}
                            />
                          </div>
                          <div style={{ width: '130px' }}>
                            <label className="form-label">Time Limit (s)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={q.time_limit || 2}
                              onChange={(e) => handleQuestionFieldChange(qIdx, 'time_limit', parseFloat(e.target.value) || 2)}
                              step="0.5"
                              min="0.5"
                              max="10"
                            />
                          </div>
                          <div style={{ width: '130px' }}>
                            <label className="form-label">Memory (MB)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={q.memory_limit || 128}
                              onChange={(e) => handleQuestionFieldChange(qIdx, 'memory_limit', parseInt(e.target.value, 10) || 128)}
                              step="16"
                              min="32"
                              max="256"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label">Starter Code</label>
                          <textarea
                            className="form-textarea"
                            rows={4}
                            value={q.starter_code || ''}
                            onChange={(e) => handleQuestionFieldChange(qIdx, 'starter_code', e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                            placeholder="// Initial template code provided to candidates..."
                          />
                        </div>

                        {/* Test Cases Editor */}
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                              Execution Test Cases ({testCases.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddTestCase(qIdx)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                              + Add Test Case
                            </button>
                          </div>

                          {testCases.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, fontStyle: 'italic' }}>
                              No test cases defined. Click "+ Add Test Case" to specify inputs and expected outputs.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {testCases.map((tc, tcIdx) => (
                                <div key={tcIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#FFFFFF', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                                  <input
                                    type="text"
                                    placeholder="Input (stdin / arg)"
                                    value={tc.input || ''}
                                    onChange={(e) => handleTestCaseChange(qIdx, tcIdx, 'input', e.target.value)}
                                    style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid #E2E8F0', borderRadius: '4px', fontFamily: 'monospace' }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Expected Output"
                                    value={tc.expected_output || ''}
                                    onChange={(e) => handleTestCaseChange(qIdx, tcIdx, 'expected_output', e.target.value)}
                                    style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid #E2E8F0', borderRadius: '4px', fontFamily: 'monospace' }}
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(tc.is_hidden)}
                                      onChange={(e) => handleTestCaseChange(qIdx, tcIdx, 'is_hidden', e.target.checked)}
                                    />
                                    Hidden
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTestCase(qIdx, tcIdx)}
                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.2rem' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Educational Explanation */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Educational Explanation (Shown to students after submission)</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={q.explanation || ''}
                        onChange={(e) => handleQuestionFieldChange(qIdx, 'explanation', e.target.value)}
                        placeholder="Explain why the selected option is correct so students learn from mistakes..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/admin" className="btn btn-outline">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
              {saving ? 'Creating Assessment...' : 'Publish Assessment'}
            </button>
          </div>
        </form>
      </div>

      <BulkQuestionImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleBulkImportSuccess}
      />

      <QuestionBankSelectorModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        onSelectQuestions={handleBankSelect}
      />
    </div>
  );
}
