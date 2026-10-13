import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';

export function BulkQuestionImportModal({ isOpen, onClose, onImportSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'complete'
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'text'
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip'); // 'skip' | 'allow'

  // Preview & Validation State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'valid' | 'errors' | 'duplicates'
  const [searchFilter, setSearchFilter] = useState('');

  // Commit & Result State
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingErrors, setDownloadingErrors] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await api.downloadQuestionBankTemplate();
    } catch (err) {
      alert(`Failed to download template: ${err.message}`);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a valid CSV file (.csv).');
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        alert('File size exceeds the 5MB maximum limit.');
        return;
      }
      setFile(selected);
      setPreviewError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.name.toLowerCase().endsWith('.csv')) {
        alert('Please drop a valid CSV file (.csv).');
        return;
      }
      if (dropped.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      setFile(dropped);
      setPreviewError(null);
    }
  };

  const handleAnalyzeCSV = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const payload = inputMode === 'file' ? file : pastedText;
      if (!payload) {
        setPreviewError('Please choose a CSV file or paste CSV text first.');
        setPreviewLoading(false);
        return;
      }

      const res = await api.previewQuestionCsv(payload);
      setPreviewData(res);
      setStep('preview');
    } catch (err) {
      setPreviewError(err.message || 'Failed to parse and validate CSV file.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    setImporting(true);
    try {
      const res = await api.importQuestionCsv({
        file: inputMode === 'file' ? file : null,
        csvContent: inputMode === 'text' ? pastedText : null,
        duplicateStrategy
      });

      setImportResult(res.data);
      setStep('complete');
      if (onImportSuccess && res.data.importedQuestions) {
        onImportSuccess(res.data.importedQuestions);
      }
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrorReport = async () => {
    if (!previewData?.rows) return;
    try {
      setDownloadingErrors(true);
      const failed = previewData.rows
        .filter(r => !r.isValid)
        .map(r => ({
          rowNumber: r.rowNumber,
          question: r.data?.question,
          errors: r.errors
        }));
      await api.downloadQuestionImportErrorReport(failed);
    } catch (err) {
      alert(`Failed to download error log: ${err.message}`);
    } finally {
      setDownloadingErrors(false);
    }
  };

  const resetAll = () => {
    setStep('upload');
    setFile(null);
    setPastedText('');
    setPreviewData(null);
    setPreviewError(null);
    setImportResult(null);
    setTableFilter('all');
    setSearchFilter('');
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Filter preview rows
  const filteredRows = (previewData?.rows || []).filter(r => {
    if (tableFilter === 'valid' && !r.isValid) return false;
    if (tableFilter === 'errors' && r.isValid) return false;
    if (tableFilter === 'duplicates' && !r.isDuplicateInFile && !r.isDuplicateInDb) return false;

    if (searchFilter.trim()) {
      const s = searchFilter.toLowerCase();
      const matchQ = (r.data?.question || '').toLowerCase().includes(s);
      const matchSub = (r.data?.subject || '').toLowerCase().includes(s);
      const matchTopic = (r.data?.topic || '').toLowerCase().includes(s);
      return matchQ || matchSub || matchTopic;
    }
    return true;
  });

  return (
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
        maxWidth: step === 'preview' ? '1100px' : '720px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        transition: 'max-width 0.25s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Bulk Question Import from CSV
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                Upload multiple-choice questions into Question Bank with instant schema validation
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem'
              }}
              title="Download standard template with sample MCQ records"
            >
              <Download size={15} />
              <span>{downloadingTemplate ? 'Downloading...' : 'Sample Template (.csv)'}</span>
            </button>

            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                padding: '0.35rem',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

          {/* ────────────────────────────────────────────────────────────
              STEP 1: UPLOAD & SELECTION
          ──────────────────────────────────────────────────────────── */}
          {step === 'upload' && (
            <div>
              {/* Input mode selector */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                background: '#F1F5F9',
                padding: '0.3rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                width: 'fit-content'
              }}>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: inputMode === 'file' ? '#FFFFFF' : 'transparent',
                    color: inputMode === 'file' ? '#0F172A' : '#64748B',
                    boxShadow: inputMode === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Upload CSV File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: inputMode === 'text' ? '#FFFFFF' : 'transparent',
                    color: inputMode === 'text' ? '#0F172A' : '#64748B',
                    boxShadow: inputMode === 'text' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Paste CSV Text
                </button>
              </div>

              {previewError && (
                <div style={{
                  padding: '0.85rem 1rem',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '0.86rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Validation Issue: </strong>
                    {previewError}
                  </div>
                </div>
              )}

              {inputMode === 'file' ? (
                <div>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '12px',
                      padding: '3rem 2rem',
                      textAlign: 'center',
                      background: file ? '#F8FAFC' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />

                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: file ? '#DCFCE7' : '#EFF6FF',
                      color: file ? '#16A34A' : '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem'
                    }}>
                      {file ? <CheckCircle2 size={28} /> : <UploadCloud size={28} />}
                    </div>

                    {file ? (
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                          {(file.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                          Choose a CSV file or drag and drop here
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
                          Supports UTF-8 CSV files with quotes, commas, and multiline questions up to 5MB (max 1000 questions per batch).
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                    Paste CSV Data (including header row)
                  </label>
                  <textarea
                    rows={10}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`question,optionA,optionB,optionC,optionD,correctAnswer,subject,topic,difficulty,explanation,marks\n"What is React?",Library,Framework,Language,Database,A,"Web Development","React Basics",EASY,"React is a UI library",4`}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      lineHeight: '1.4'
                    }}
                  />
                </div>
              )}

              {/* Format Guide Alert */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.25rem',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#0369A1'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HelpCircle size={15} /> Expected CSV Columns:
                </div>
                <div>
                  <code>question</code>, <code>optionA</code>, <code>optionB</code>, <code>optionC</code>, <code>optionD</code>, <code>correctAnswer</code> (A, B, C or D), <code>subject</code>, <code>topic</code>, <code>difficulty</code> (EASY, MEDIUM, HARD), <code>explanation</code>, <code>marks</code>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────
              STEP 2: PREVIEW & VALIDATION TABLE
          ──────────────────────────────────────────────────────────── */}
          {step === 'preview' && previewData && (
            <div>
              {/* Summary Stats Chips */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  background: '#F8FAFC',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Total Questions in File</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
                    {previewData.summary.totalRows}
                  </div>
                </div>

                <div style={{
                  background: '#F0FDF4',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #BBF7D0'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Ready to Import</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D' }}>
                    {previewData.summary.validRows}
                  </div>
                </div>

                <div style={{
                  background: previewData.summary.invalidRows > 0 ? '#FEF2F2' : '#F8FAFC',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: `1px solid ${previewData.summary.invalidRows > 0 ? '#FECACA' : '#E2E8F0'}`
                }}>
                  <div style={{ fontSize: '0.75rem', color: previewData.summary.invalidRows > 0 ? '#991B1B' : '#64748B', fontWeight: 600 }}>
                    Invalid / Has Errors
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: previewData.summary.invalidRows > 0 ? '#DC2626' : '#64748B' }}>
                    {previewData.summary.invalidRows}
                  </div>
                </div>

                <div style={{
                  background: '#FFFBEB',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #FDE68A'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>Duplicates Detected</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>
                    {previewData.summary.duplicateInDbCount + previewData.summary.duplicateInFileCount}
                  </div>
                </div>
              </div>

              {/* Duplicate Strategy & Actions Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '0.85rem 1rem',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    Duplicate Handling:
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="dupStrategy"
                      value="skip"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                    />
                    <span>Skip duplicates (Recommended)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="dupStrategy"
                      value="allow"
                      checked={duplicateStrategy === 'allow'}
                      onChange={() => setDuplicateStrategy('allow')}
                    />
                    <span>Allow duplicate import</span>
                  </label>
                </div>

                {previewData.summary.invalidRows > 0 && (
                  <button
                    onClick={handleDownloadErrorReport}
                    disabled={downloadingErrors}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      color: '#DC2626',
                      borderColor: '#FCA5A5'
                    }}
                  >
                    <Download size={14} />
                    <span>{downloadingErrors ? 'Downloading...' : 'Export Error Details (.csv)'}</span>
                  </button>
                )}
              </div>

              {/* Filter and Search Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'all', label: `All Rows (${previewData.summary.totalRows})` },
                    { key: 'valid', label: `Valid Only (${previewData.summary.validRows})` },
                    { key: 'errors', label: `Errors Only (${previewData.summary.invalidRows})` },
                    { key: 'duplicates', label: `Duplicates (${previewData.summary.duplicateInDbCount + previewData.summary.duplicateInFileCount})` }
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setTableFilter(f.key)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: '1px solid',
                        cursor: 'pointer',
                        borderColor: tableFilter === f.key ? '#2563EB' : '#CBD5E1',
                        background: tableFilter === f.key ? '#EFF6FF' : '#FFFFFF',
                        color: tableFilter === f.key ? '#1D4ED8' : '#475569'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search in preview..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.65rem 0.4rem 2rem',
                      fontSize: '0.82rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>

              {/* Interactive Preview Table */}
              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                overflowX: 'auto',
                maxHeight: '360px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ background: '#F1F5F9', position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', width: '50px' }}>Row</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', width: '90px' }}>Status</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155' }}>Question & Subject</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', width: '120px' }}>Options (Key)</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155', width: '80px' }}>Marks</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#334155' }}>Validation Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                          No questions match the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr
                          key={r.rowNumber}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: !r.isValid ? '#FEF2F2' : r.isDuplicateInDb ? '#FFFBEB' : '#FFFFFF'
                          }}
                        >
                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#64748B' }}>
                            #{r.rowNumber}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            {r.isValid ? (
                              r.isDuplicateInDb ? (
                                <span style={{
                                  background: '#FEF3C7',
                                  color: '#B45309',
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  fontSize: '0.72rem'
                                }}>
                                  DUP-DB
                                </span>
                              ) : (
                                <span style={{
                                  background: '#DCFCE7',
                                  color: '#15803D',
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  fontSize: '0.72rem'
                                }}>
                                  VALID
                                </span>
                              )
                            ) : (
                              <span style={{
                                background: '#FEE2E2',
                                color: '#B91C1C',
                                padding: '0.2rem 0.45rem',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '0.72rem'
                              }}>
                                INVALID
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '0.2rem' }}>
                              {r.data.question || <em style={{ color: '#94A3B8' }}>Empty Question Text</em>}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                              <span>{r.data.subject}</span> • <span>{r.data.topic}</span> • <span style={{ textTransform: 'uppercase' }}>{r.data.difficulty}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: '#2563EB',
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.75rem'
                              }}>
                                {r.data.correctAnswer || '?'}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                                4 options
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#334155' }}>
                            +{r.data.marks} / -{r.data.negativeMarks}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            {r.errors && r.errors.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {r.errors.map((err, eIdx) => (
                                  <span key={eIdx} style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600 }}>
                                    • {err}
                                  </span>
                                ))}
                              </div>
                            )}
                            {r.warnings && r.warnings.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                                {r.warnings.map((warn, wIdx) => (
                                  <span key={wIdx} style={{ color: '#D97706', fontSize: '0.74rem' }}>
                                    ⚠ {warn}
                                  </span>
                                ))}
                              </div>
                            )}
                            {r.errors.length === 0 && r.warnings.length === 0 && (
                              <span style={{ color: '#16A34A', fontSize: '0.75rem' }}>Ready</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────
              STEP 3: IMPORT COMPLETE SUMMARY
          ──────────────────────────────────────────────────────────── */}
          {step === 'complete' && importResult && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                Bulk Import Completed!
              </h3>
              <p style={{ color: '#64748B', maxWidth: '460px', margin: '0 auto 1.75rem', fontSize: '0.9rem' }}>
                {importResult.importedCount} questions have been safely committed into the Question Bank and are ready for tests and quizzes.
              </p>

              {/* Counts Card */}
              <div style={{
                display: 'inline-flex',
                gap: '1.5rem',
                padding: '1rem 2rem',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '2rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Imported</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16A34A' }}>
                    {importResult.importedCount}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid #CBD5E1' }}></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Skipped (Duplicates)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>
                    {importResult.skippedCount}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid #CBD5E1' }}></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Failed (Errors)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626' }}>
                    {importResult.failedCount}
                  </div>
                </div>
              </div>

              {importResult.failedCount > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <button
                    onClick={async () => {
                      await api.downloadQuestionImportErrorReport(importResult.failedRows);
                    }}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                  >
                    <Download size={15} />
                    <span>Download Failed Rows Report (.csv)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC'
        }}>
          {step === 'upload' && (
            <>
              <button onClick={handleClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAnalyzeCSV}
                disabled={previewLoading || (inputMode === 'file' ? !file : !pastedText.trim())}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {previewLoading ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Analyzing CSV...</span>
                  </>
                ) : (
                  <>
                    <span>Preview & Validate CSV</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => setStep('upload')} className="btn btn-secondary">
                Back to Upload
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={importing || previewData.summary.validRows === 0}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
                >
                  {importing ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Importing to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>
                        Import {previewData.summary.validRows} Question{previewData.summary.validRows !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'complete' && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={resetAll} className="btn btn-secondary">
                Import Another File
              </button>
              <button onClick={handleClose} className="btn btn-primary">
                Done & View Bank
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkQuestionImportModal;
