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
  ChevronRight
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
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Modals state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Question Form state
  const [newQuestion, setNewQuestion] = useState({
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
    negative_marks: 1
  });
  const [creating, setCreating] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getQuestionBank({
        search,
        subject: subjectFilter,
        difficulty: difficultyFilter,
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
    try {
      const filters = await api.getQuestionBankFilters();
      if (filters?.subjects) {
        setAvailableSubjects(filters.subjects);
      }
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [search, subjectFilter, difficultyFilter, page]);

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

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question_text.trim() || !newQuestion.subject.trim() || !newQuestion.topic.trim()) {
      showToast('Please fill in Question, Subject, and Topic.', 'error');
      return;
    }
    if (!newQuestion.optionA || !newQuestion.optionB || !newQuestion.optionC || !newQuestion.optionD) {
      showToast('All 4 options (A, B, C, D) are required.', 'error');
      return;
    }

    setCreating(true);
    try {
      const answerIndexMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      await api.createQuestionBankItem({
        question_text: newQuestion.question_text.trim(),
        options: [newQuestion.optionA, newQuestion.optionB, newQuestion.optionC, newQuestion.optionD],
        correct_option_index: answerIndexMap[newQuestion.correctAnswer] ?? 0,
        correct_answer: newQuestion.correctAnswer,
        subject: newQuestion.subject.trim(),
        topic: newQuestion.topic.trim(),
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation.trim(),
        marks: parseFloat(newQuestion.marks) || 4.0,
        negative_marks: parseFloat(newQuestion.negative_marks) || 1.0
      });

      showToast('Question created successfully', 'success');
      setCreateModalOpen(false);
      setNewQuestion({
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
        negative_marks: 1
      });
      fetchQuestions();
      fetchFilterOptions();
    } catch (err) {
      showToast(err.message || 'Failed to create question', 'error');
    } finally {
      setCreating(false);
    }
  };

  const getDifficultyColor = (diff) => {
    const d = (diff || '').toUpperCase();
    if (d === 'EASY') return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
    if (d === 'HARD') return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
    return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{
              background: '#EFF6FF',
              color: '#2563EB',
              padding: '0.3rem 0.6rem',
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
            Centralized question storage for tests, quizzes, and automated exam generation with bulk CSV support.
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
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
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
            <option value="all">All Subjects</option>
            {availableSubjects.map((sub, idx) => (
              <option key={idx} value={sub}>{sub}</option>
            ))}
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
            fetchQuestions();
            fetchFilterOptions();
          }}
          className="btn btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#64748B' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Questions Content List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem', color: '#2563EB' }} />
          <p>Loading Question Bank repository...</p>
        </div>
      ) : questions.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
            Get started by importing your existing questions via CSV, or add questions manually to reuse them across tests and quizzes.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={() => setImportModalOpen(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileSpreadsheet size={16} />
              <span>Bulk Import CSV</span>
            </button>
            <button onClick={() => api.downloadQuestionBankTemplate()} className="btn btn-secondary">
              <Download size={15} /> Download Sample Template
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => {
            const diffStyle = getDifficultyColor(q.difficulty);
            const options = Array.isArray(q.options) ? q.options : [];
            const correctIdx = q.correct_option_index !== undefined ? q.correct_option_index : (q.correct_answer === 'B' ? 1 : q.correct_answer === 'C' ? 2 : q.correct_answer === 'D' ? 3 : 0);

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
                      +{q.marks} Marks • -{q.negative_marks} Penalty
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

                {/* 4 Options Grid */}
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
                        {isCorrect && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                            CORRECT
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Footnote */}
                {q.explanation && (
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    background: '#F0F9FF',
                    borderLeft: '3px solid #0284C7',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '0.8rem',
                    color: '#0369A1'
                  }}>
                    <strong>Explanation: </strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalCount > pageSize && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={(page + 1) * pageSize >= totalCount}
                  onClick={() => setPage(p => p + 1)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  <ChevronRight size={16} />
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
            maxWidth: '650px',
            width: '100%',
            padding: '1.75rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 800 }}>
              Add Question to Bank
            </h3>
            <form onSubmit={handleCreateQuestion}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Correct Answer *
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
                    Marks
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    placeholder="e.g. Computer Science Fundamentals"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
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
                    placeholder="e.g. Binary Search Trees"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

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
