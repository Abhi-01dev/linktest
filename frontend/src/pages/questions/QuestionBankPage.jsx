import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BulkQuestionImportModal } from '../../components/questions/BulkQuestionImportModal';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Trash2,
  Download,
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Code,
  FileText,
  Lock,
  Eye,
  Clock,
  Cpu
} from 'lucide-react';

export function QuestionBankPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Modals state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Question Form state
  const initialQuestionState = {
    question_type: 'mcq_single',
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    subject: '',
    topic: '',
    difficulty: 'MEDIUM',
    explanation: '',
    marks: 4,
    negative_marks: 1,
    expected_answer: '',
    evaluation_criteria: 'Correct concept\nImportant terminology\nExplanation quality\nRelevant example',
    programming_language: 'javascript',
    starter_code: 'function solution() {\n  // write your code here\n}',
    time_limit: 2.0,
    memory_limit: 128,
    test_cases: [
      { input: '2 3', expected_output: '5', is_hidden: false }
    ]
  };

  const [newQuestion, setNewQuestion] = useState(initialQuestionState);
  const [creating, setCreating] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getQuestionBank({
        search,
        subject: subjectFilter,
        difficulty: difficultyFilter,
        question_type: typeFilter,
        limit: pageSize,
        offset: page * pageSize
      });
      setQuestions(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      showToast('Failed to load questions from Question Bank', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    const [filtersResult, catalogResult] = await Promise.allSettled([
      api.getQuestionBankFilters(),
      api.getAdminSubjects()
    ]);
    const subjectNames = new Set();
    if (filtersResult.status === 'fulfilled' && Array.isArray(filtersResult.value?.subjects)) {
      filtersResult.value.subjects.forEach(subject => subjectNames.add(subject));
    } else if (filtersResult.status === 'rejected') {
      console.error('Failed to load existing question bank subjects', filtersResult.reason);
    }
    if (catalogResult.status === 'fulfilled') {
      catalogResult.value.forEach(subject => subjectNames.add(subject.name));
    } else {
      showToast('Failed to load the curriculum subject catalog', 'error');
    }
    setAvailableSubjects([...subjectNames].filter(Boolean).sort((left, right) => left.localeCompare(right)));
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [search, subjectFilter, difficultyFilter, typeFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question from the Question Bank?')) {
      return;
    }
    try {
      await api.deleteQuestionBankItem(id);
      showToast('Question deleted successfully', 'success');
      fetchQuestions();
      fetchFilterOptions();
    } catch (err) {
      showToast(err.message || 'Failed to delete question', 'error');
    }
  };

  const handleAddTestCase = () => {
    setNewQuestion(prev => ({
      ...prev,
      test_cases: [
        ...prev.test_cases,
        { input: '', expected_output: '', is_hidden: false }
      ]
    }));
  };

  const handleRemoveTestCase = (index) => {
    setNewQuestion(prev => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, idx) => idx !== index)
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setNewQuestion(prev => {
      const updated = [...prev.test_cases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, test_cases: updated };
    });
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question_text.trim() || !newQuestion.subject.trim() || !newQuestion.topic.trim()) {
      showToast('Please fill in Question, Subject, and Topic.', 'error');
      return;
    }

    const qType = newQuestion.question_type;

    if (qType === 'mcq_single') {
      if (!newQuestion.optionA || !newQuestion.optionB || !newQuestion.optionC || !newQuestion.optionD) {
        showToast('All 4 options (A, B, C, D) are required for Multiple Choice.', 'error');
        return;
      }
    } else if (qType === 'coding') {
      if (!newQuestion.starter_code.trim()) {
        showToast('Starter code is required for Coding Questions.', 'error');
        return;
      }
      if (!newQuestion.test_cases || newQuestion.test_cases.length === 0) {
        showToast('Please add at least one test case for the coding question.', 'error');
        return;
      }
    }

    setCreating(true);
    try {
      const answerIndexMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      const payload = {
        question_type: qType,
        question_text: newQuestion.question_text.trim(),
        subject: newQuestion.subject.trim(),
        topic: newQuestion.topic.trim(),
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation.trim(),
        marks: parseFloat(newQuestion.marks) || 4.0,
        negative_marks: parseFloat(newQuestion.negative_marks) || 0.0
      };

      if (qType === 'mcq_single') {
        payload.options = [newQuestion.optionA, newQuestion.optionB, newQuestion.optionC, newQuestion.optionD];
        payload.correct_option_index = answerIndexMap[newQuestion.correctAnswer] ?? 0;
        payload.correct_answer = newQuestion.correctAnswer;
      } else if (qType === 'true_false') {
        payload.options = ['True', 'False'];
        payload.correct_option_index = newQuestion.correctAnswer === 'True' || newQuestion.correctAnswer === 'A' ? 0 : 1;
        payload.correct_answer = payload.correct_option_index === 0 ? 'A' : 'B';
      } else if (qType === 'long_answer') {
        payload.expected_answer = newQuestion.expected_answer.trim();
        payload.evaluation_criteria = newQuestion.evaluation_criteria.trim();
        payload.options = [];
        payload.correct_answer = '';
      } else if (qType === 'coding') {
        payload.programming_language = newQuestion.programming_language;
        payload.starter_code = newQuestion.starter_code;
        payload.time_limit = parseFloat(newQuestion.time_limit) || 2.0;
        payload.memory_limit = parseInt(newQuestion.memory_limit, 10) || 128;
        payload.test_cases = newQuestion.test_cases;
        payload.options = [];
        payload.correct_answer = '';
      }

      await api.createQuestionBankItem(payload);

      showToast('Question created successfully', 'success');
      setCreateModalOpen(false);
      setNewQuestion(initialQuestionState);
      fetchQuestions();
      fetchFilterOptions();
    } catch (err) {
      showToast(err.message || 'Failed to create question', 'error');
    } finally {
      setCreating(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (String(diff).toUpperCase()) {
      case 'EASY':
        return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
      case 'HARD':
        return { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' };
      case 'MEDIUM':
      default:
        return { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' };
    }
  };

  const getTypeBadge = (qType) => {
    switch (String(qType).toLowerCase()) {
      case 'coding':
        return { label: 'Coding Question', bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF', icon: <Code size={12} /> };
      case 'long_answer':
      case 'subjective':
        return { label: 'Long Answer', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: <FileText size={12} /> };
      case 'true_false':
        return { label: 'True / False', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: <CheckCircle2 size={12} /> };
      case 'mcq_single':
      case 'mcq_multiple':
      default:
        return { label: 'Multiple Choice', bg: '#F1F5F9', text: '#334155', border: '#CBD5E1', icon: <Layers size={12} /> };
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              background: '#EFF6FF',
              color: '#2563EB',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800
            }}>
              QUESTION BANK REPOSITORY
            </span>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              {totalCount} Total Questions
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-navy, #0F172A)' }}>
            Assessment Question Bank
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: '#64748B' }}>
            Author, organize, and manage Multiple Choice, True/False, Long Answer, and Coding questions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => api.downloadQuestionBankTemplate()}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Download size={16} />
            <span>CSV Template</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 800,
              background: '#2563EB',
              borderColor: '#2563EB'
            }}
          >
            <FileSpreadsheet size={17} />
            <span>Bulk Import CSV</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Add Single Question</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by question text, subject, or topic..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: '0.55rem 0.85rem',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: '#FFFFFF'
            }}
          >
            <option value="all">All Question Types</option>
            <option value="mcq_single">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="long_answer">Long Answer</option>
            <option value="coding">Coding Question</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPage(0);
            }}
            disabled={availableSubjects.length === 0}
            style={{
              padding: '0.55rem 0.85rem',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: '#FFFFFF'
            }}
          >
            {availableSubjects.length === 0 ? (
              <option value="" disabled>No options</option>
            ) : (
              <>
                <option value="all">All Subjects</option>
                {availableSubjects.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </>
            )}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: '0.55rem 0.85rem',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: '#FFFFFF'
            }}
          >
            <option value="all">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSearch('');
            setSubjectFilter('all');
            setDifficultyFilter('all');
            setTypeFilter('all');
            setPage(0);
          }}
          className="btn btn-ghost"
          style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', color: '#64748B' }}
        >
          <RefreshCw size={14} style={{ marginRight: '0.35rem' }} />
          Reset Filters
        </button>
      </div>

      {/* Main Questions Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#64748B' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading questions from Question Bank repository...</p>
        </div>
      ) : questions.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px dashed #CBD5E1',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <FileSpreadsheet size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
            No Questions in the Bank Yet
          </h3>
          <p style={{ color: '#64748B', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.88rem' }}>
            Get started by importing your questions via CSV, or add Multiple Choice, True/False, Long Answer, or Coding questions manually.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={() => setImportModalOpen(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileSpreadsheet size={16} />
              <span>Bulk Import CSV</span>
            </button>
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-secondary">
              <Plus size={15} /> Add Single Question
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => {
            const diffStyle = getDifficultyColor(q.difficulty);
            const typeStyle = getTypeBadge(q.question_type);
            const options = Array.isArray(q.options) ? q.options : [];
            const correctIdx = q.correct_option_index !== undefined ? q.correct_option_index : (q.correct_answer === 'B' ? 1 : q.correct_answer === 'C' ? 2 : q.correct_answer === 'D' ? 3 : 0);
            const isCoding = q.question_type === 'coding';
            const isLongAnswer = q.question_type === 'long_answer' || q.question_type === 'subjective';

            return (
              <div
                key={q.id || idx}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s ease'
                }}
              >
                {/* Question Top Row: Meta Tags & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#F1F5F9',
                      color: '#475569',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 800
                    }}>
                      #{page * pageSize + idx + 1}
                    </span>

                    <span style={{
                      background: typeStyle.bg,
                      color: typeStyle.text,
                      border: `1px solid ${typeStyle.border}`,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      textTransform: 'uppercase'
                    }}>
                      {typeStyle.icon}
                      {typeStyle.label}
                    </span>

                    <span style={{
                      background: diffStyle.bg,
                      color: diffStyle.text,
                      border: `1px solid ${diffStyle.border}`,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      {q.difficulty || 'MEDIUM'}
                    </span>

                    <span style={{
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600
                    }}>
                      {q.subject}
                    </span>

                    <span style={{
                      background: '#F8FAFC',
                      color: '#64748B',
                      border: '1px solid #E2E8F0',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.74rem'
                    }}>
                      {q.topic}
                    </span>

                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                      +{q.marks} Marks {q.negative_marks > 0 ? `• -${q.negative_marks} Penalty` : ''}
                    </span>
                  </div>

                  {(user?.role === 'ADMIN' || q.created_by === user?.id) && (
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="btn btn-ghost"
                      style={{ color: '#EF4444', padding: '0.3rem' }}
                      title="Delete question from Bank"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.85rem', lineHeight: '1.45' }}>
                  {q.question_text}
                </div>

                {/* MCQ Options Rendering */}
                {!isCoding && !isLongAnswer && options.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    {options.map((opt, oIdx) => {
                      const isCorrect = correctIdx === oIdx;
                      return (
                        <div
                          key={oIdx}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '6px',
                            border: isCorrect ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                            background: isCorrect ? '#ECFDF5' : '#F8FAFC',
                            color: isCorrect ? '#065F46' : '#334155',
                            fontWeight: isCorrect ? 700 : 400,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <span style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isCorrect ? '#10B981' : '#CBD5E1',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Long Answer Info Block */}
                {isLongAnswer && (
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.85rem'
                  }}>
                    {q.expected_answer && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>Expected Answer Model: </span>
                        <span style={{ color: '#334155' }}>{q.expected_answer}</span>
                      </div>
                    )}
                    {q.evaluation_criteria && (
                      <div>
                        <span style={{ fontWeight: 700, color: '#2563EB' }}>Evaluation Criteria: </span>
                        <span style={{ color: '#475569', whiteSpace: 'pre-line' }}>{q.evaluation_criteria}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Coding Question Info Block */}
                {isCoding && (
                  <div style={{
                    background: '#0F172A',
                    color: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Code size={13} color="#38BDF8" /> Language: <strong style={{ color: '#38BDF8' }}>{(q.programming_language || 'javascript').toUpperCase()}</strong>
                      </span>
                      <span style={{ display: 'flex', gap: '0.75rem' }}>
                        <span>Time Limit: {q.time_limit || 2.0}s</span>
                        <span>Memory: {q.memory_limit || 128}MB</span>
                      </span>
                    </div>

                    {q.starter_code && (
                      <pre style={{
                        background: '#020617',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        overflowX: 'auto',
                        margin: '0.4rem 0'
                      }}>
                        {q.starter_code}
                      </pre>
                    )}

                    {Array.isArray(q.test_cases) && q.test_cases.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                        Test Cases: {q.test_cases.filter(tc => !tc.is_hidden).length} Public • {q.test_cases.filter(tc => tc.is_hidden).length} Hidden
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div style={{
                    fontSize: '0.82rem',
                    color: '#475569',
                    background: '#F1F5F9',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.4rem'
                  }}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>Explanation:</span>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              padding: '0.75rem 0'
            }}>
              <div style={{ fontSize: '0.84rem', color: '#64748B' }}>
                Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} questions
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      <BulkQuestionImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => {
          fetchQuestions();
          fetchFilterOptions();
        }}
      />

      {/* Single Add Question Modal */}
      {createModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            maxWidth: '720px',
            width: '100%',
            padding: '1.75rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>
              Add Question to Bank
            </h3>
            <form onSubmit={handleCreateQuestion}>
              {/* Question Type Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Question Type *
                </label>
                <select
                  value={newQuestion.question_type}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontWeight: 600 }}
                >
                  <option value="mcq_single">Multiple Choice (Single Answer)</option>
                  <option value="true_false">True / False</option>
                  <option value="long_answer">Long Answer (Subjective)</option>
                  <option value="coding">Coding Question</option>
                </select>
              </div>

              {/* Question Text / Problem Statement */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  {newQuestion.question_type === 'coding' ? 'Problem Statement *' : 'Question Prompt *'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={newQuestion.question_type === 'coding' ? 'e.g. Write a JavaScript function that returns the sum of two numbers.' : 'Enter question text...'}
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              {/* Subject, Topic, Difficulty & Marks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Subject *
                  </label>
                  <select
                    required
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    disabled={availableSubjects.length === 0}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    {availableSubjects.length === 0 ? (
                      <option value="" disabled>No options</option>
                    ) : (
                      <>
                        <option value="">Select a subject</option>
                        {availableSubjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Topic *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion.topic}
                    onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                    placeholder="e.g. JavaScript Functions"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Difficulty *
                  </label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Marks *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Negative Penalty
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newQuestion.negative_marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, negative_marks: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              {/* Conditional Fields: Multiple Choice */}
              {newQuestion.question_type === 'mcq_single' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <div key={letter}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                          Option {letter} *
                        </label>
                        <input
                          type="text"
                          required
                          value={newQuestion[`option${letter}`]}
                          onChange={(e) => setNewQuestion({ ...newQuestion, [`option${letter}`]: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Correct Option *
                    </label>
                    <select
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                </>
              )}

              {/* Conditional Fields: True / False */}
              {newQuestion.question_type === 'true_false' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Correct Answer *
                  </label>
                  <select
                    value={newQuestion.correctAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="A">True</option>
                    <option value="B">False</option>
                  </select>
                </div>
              )}

              {/* Conditional Fields: Long Answer */}
              {newQuestion.question_type === 'long_answer' && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Expected Answer (Teacher Reference Model)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Outline key expected concepts, steps, or standard reference answer..."
                      value={newQuestion.expected_answer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, expected_answer: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Evaluation Criteria (Grading Rubric)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="- Correct concept&#10;- Important terminology&#10;- Explanation quality&#10;- Relevant example"
                      value={newQuestion.evaluation_criteria}
                      onChange={(e) => setNewQuestion({ ...newQuestion, evaluation_criteria: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                </>
              )}

              {/* Conditional Fields: Coding Question */}
              {newQuestion.question_type === 'coding' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                        Programming Language
                      </label>
                      <select
                        value={newQuestion.programming_language}
                        onChange={(e) => setNewQuestion({ ...newQuestion, programming_language: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      >
                        <option value="javascript">JavaScript</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                        Time Limit (Seconds)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={newQuestion.time_limit}
                        onChange={(e) => setNewQuestion({ ...newQuestion, time_limit: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                        Memory Limit (MB)
                      </label>
                      <input
                        type="number"
                        step="16"
                        min="32"
                        max="512"
                        value={newQuestion.memory_limit}
                        onChange={(e) => setNewQuestion({ ...newQuestion, memory_limit: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Starter Code *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newQuestion.starter_code}
                      onChange={(e) => setNewQuestion({ ...newQuestion, starter_code: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        background: '#F8FAFC'
                      }}
                    />
                  </div>

                  {/* Test Cases Builder */}
                  <div style={{ marginBottom: '1rem', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                        Test Cases ({newQuestion.test_cases.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddTestCase}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                      >
                        <Plus size={14} /> Add Test Case
                      </button>
                    </div>

                    {newQuestion.test_cases.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        style={{
                          background: tc.is_hidden ? '#FFFBEB' : '#F8FAFC',
                          border: `1px solid ${tc.is_hidden ? '#FDE68A' : '#CBD5E1'}`,
                          borderRadius: '6px',
                          padding: '0.6rem 0.75rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: tc.is_hidden ? '#B45309' : '#334155' }}>
                            Test Case #{tcIdx + 1} {tc.is_hidden ? '(Hidden from Students)' : '(Public)'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={tc.is_hidden}
                                onChange={(e) => handleTestCaseChange(tcIdx, 'is_hidden', e.target.checked)}
                              />
                              Hidden Test
                            </label>
                            {newQuestion.test_cases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTestCase(tcIdx)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <input
                              type="text"
                              placeholder="Input (e.g. 2 3)"
                              value={tc.input}
                              onChange={(e) => handleTestCaseChange(tcIdx, 'input', e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontFamily: 'monospace' }}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Expected Output (e.g. 5)"
                              value={tc.expected_output}
                              onChange={(e) => handleTestCaseChange(tcIdx, 'expected_output', e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontFamily: 'monospace' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionBankPage;
