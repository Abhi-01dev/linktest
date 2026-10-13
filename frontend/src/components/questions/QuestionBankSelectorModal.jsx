import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Layers,
  X,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { BulkQuestionImportModal } from './BulkQuestionImportModal';

export function QuestionBankSelectorModal({ isOpen, onClose, onSelectQuestions }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getQuestionBank({
        search,
        subject: subjectFilter,
        limit: 100
      });
      setQuestions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const filters = await api.getQuestionBankFilters();
      if (filters?.subjects) {
        setAvailableSubjects(filters.subjects);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (isOpen) {
      loadFilters();
      loadQuestions();
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [search, subjectFilter]);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  };

  const handleConfirm = () => {
    const selected = questions.filter(q => selectedIds.has(q.id));
    if (onSelectQuestions) {
      onSelectQuestions(selected);
    }
    onClose();
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        backdropFilter: 'blur(3px)'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={20} style={{ color: '#2563EB' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  Select from Question Bank
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  Pick banked questions to append to your active assessment
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setBulkImportOpen(true)}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <FileSpreadsheet size={15} />
                <span>Import CSV to Bank</span>
              </button>

              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            gap: '0.75rem',
            background: '#FFFFFF',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search questions by text or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem 0.45rem 2rem',
                  fontSize: '0.82rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px'
                }}
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                background: '#FFFFFF'
              }}
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </select>

            {questions.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
              >
                {selectedIds.size === questions.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Questions Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                <span>Loading Question Bank...</span>
              </div>
            ) : questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                <Layers size={32} style={{ color: '#CBD5E1', margin: '0 auto 0.75rem' }} />
                <p style={{ margin: 0 }}>No questions found in Question Bank matching criteria.</p>
                <button
                  onClick={() => setBulkImportOpen(true)}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FileSpreadsheet size={15} /> Import Questions via CSV
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {questions.map((q) => {
                  const isChecked = selectedIds.has(q.id);
                  const options = Array.isArray(q.options) ? q.options : [];
                  const correctIdx = q.correct_option_index !== undefined ? q.correct_option_index : 0;

                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelect(q.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        border: isChecked ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                        background: isChecked ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ marginTop: '2px', color: isChecked ? '#2563EB' : '#94A3B8' }}>
                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            background: '#F1F5F9',
                            color: '#475569',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {q.subject}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {q.topic}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: q.difficulty === 'HARD' ? '#B91C1C' : q.difficulty === 'EASY' ? '#15803D' : '#B45309'
                          }}>
                            • {q.difficulty}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: 'auto' }}>
                            +{q.marks} Marks
                          </span>
                        </div>

                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.4rem' }}>
                          {q.question_text}
                        </div>

                        {options.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', fontSize: '0.78rem' }}>
                            {options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                style={{
                                  color: correctIdx === oIdx ? '#15803D' : '#64748B',
                                  fontWeight: correctIdx === oIdx ? 700 : 400
                                }}
                              >
                                {String.fromCharCode(65 + oIdx)}. {opt} {correctIdx === oIdx && '✓'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC'
          }}>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              <strong>{selectedIds.size}</strong> question{selectedIds.size !== 1 ? 's' : ''} selected
            </span>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Plus size={16} />
                <span>Add Selected ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BulkQuestionImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImportSuccess={() => {
          loadQuestions();
          loadFilters();
        }}
      />
    </>
  );
}

export default QuestionBankSelectorModal;
