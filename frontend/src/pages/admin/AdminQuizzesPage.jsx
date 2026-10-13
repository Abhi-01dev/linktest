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
      options: [
        'To reduce disk storage requirements',
        'To significantly speed up data query retrieval at the cost of slower writes',
        'To prevent unauthorized SQL queries',
        'To automatically back up database tables'
      ],
      correct_option_index: 1,
      explanation: 'Indexes create efficient lookup data structures (like B-trees) that enable fast logarithmic search times for SELECT queries, while introducing modest overhead for INSERT/UPDATE operations.'
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const handleBulkImportSuccess = (importedList) => {
    if (Array.isArray(importedList) && importedList.length > 0) {
      const mapped = importedList.map(q => ({
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
        correct_option_index: q.correct_option_index ?? 0,
        explanation: q.explanation || ''
      }));
      setQuestions(prev => [...prev, ...mapped]);
      showToast(`Appended ${mapped.length} imported questions to quiz.`, 'success');
    }
  };

  const handleBankSelect = (selectedList) => {
    if (Array.isArray(selectedList) && selectedList.length > 0) {
      const mapped = selectedList.map(q => ({
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
        correct_option_index: q.correct_option_index ?? 0,
        explanation: q.explanation || ''
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
        options: ['', '', '', ''],
        correct_option_index: 0,
        explanation: ''
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

  const handleQuestionTextChange = (idx, val) => {
    setQuestions(prev => {
      const next = [...prev];
      next[idx].question_text = val;
      return next;
    });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    setQuestions(prev => {
      const next = [...prev];
      const nextOptions = [...next[qIdx].options];
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

  const handleExplanationChange = (qIdx, val) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx].explanation = val;
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
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="card" style={{ padding: '2rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-orange-dark)', textTransform: 'uppercase' }}>
                      Question #{qIdx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Text</label>
                    <input
                      type="text"
                      className="form-input"
                      value={q.question_text}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      required
                      placeholder="e.g. Which time complexity best characterizes QuickSort average case?"
                    />
                  </div>

                  {/* Options */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Options (Select the radio corresponding to the correct answer)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {q.options.map((opt, optIdx) => (
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

                  {/* Educational Explanation */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Educational Explanation (Shown to students after submission)</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={q.explanation}
                      onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                      required
                      placeholder="Explain why the selected option is correct so students learn from mistakes..."
                    />
                  </div>
                </div>
              ))}
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
