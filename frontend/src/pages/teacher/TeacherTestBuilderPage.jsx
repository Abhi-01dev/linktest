// Teacher Test Creation & Authoring Studio with AI Question Generator
// LinkTest Enterprise Examination Studio

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Save,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Camera,
  Maximize2,
  Clock,
  Award,
  Layers,
  Upload,
  RefreshCw,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { BulkQuestionImportModal } from '../../components/questions/BulkQuestionImportModal';
import { QuestionBankSelectorModal } from '../../components/questions/QuestionBankSelectorModal';

export function TeacherTestBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState('general'); // 'general', 'proctoring', 'questions'
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '1. Standard examination rules apply.\n2. Do not leave the exam tab.\n3. Ensure your webcam remains on and face is centered.',
    subject: 'Computer Science',
    batch_id: '',
    topic: 'Web Development & Cloud',
    difficulty: 'medium',
    category: 'mock_exam',
    duration_minutes: 45,
    total_marks: 40,
    pass_percentage: 50,
    max_attempts: 3,
    randomize_questions: true,
    randomize_options: true,
    negative_marking: true,
    negative_mark_penalty: 1.0,
    proctoring_config: {
      webcam_required: true,
      face_detection: true,
      multi_face_warning: true,
      face_absence_warning: true,
      fullscreen_required: true,
      tab_switch_warning: true,
      audio_check_required: false,
      max_warnings: 5
    },
    status: 'draft',
    results_published: false,
    allow_instant_result: true,
    show_explanations: true
  });

  const [batches, setBatches] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Modals state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // Manual Question Form State
  const initialNewQ = {
    question_text: '',
    question_type: 'mcq_single',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer_key: { correct_index: 0 },
    marks: 4,
    negative_marks: 1,
    explanation: '',
    topic: '',
    difficulty: 'medium',
    case_passage: '',
    expected_answer: '',
    evaluation_criteria: 'Correct concept\nImportant terminology\nExplanation quality\nRelevant example',
    programming_language: 'javascript',
    starter_code: 'function solution() {\n  // write code\n}',
    time_limit: 2.0,
    memory_limit: 128,
    test_cases: [{ input: '2 3', expected_output: '5', is_hidden: false }]
  };
  const [newQ, setNewQ] = useState(initialNewQ);

  // AI Generator Form State
  const [aiForm, setAiForm] = useState({
    subject: 'Computer Science',
    topic: 'React 18 & Node.js Architecture',
    syllabus: '',
    difficulty: 'medium',
    count: 5,
    question_types: ['mcq_single']
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreviewQuestions, setAiPreviewQuestions] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiModelUsed, setAiModelUsed] = useState(null);
  const [initializingOllama, setInitializingOllama] = useState(false);

  // Load available batches for target selection
  useEffect(() => {
    async function fetchBatches() {
      try {
        const res = await api.getBatches({ scope: 'all' });
        const list = Array.isArray(res) ? res : (res?.batches || res?.data || []);
        setBatches(list);
      } catch (err) {
        console.error('Failed to load batches:', err);
      }
    }
    fetchBatches();
  }, []);

  // Load existing test if editing
  useEffect(() => {
    if (isEditing) {
      async function loadExisting() {
        try {
          const test = await api.getMockTestById(id);
          setFormData({
            title: test.title || '',
            description: test.description || '',
            instructions: test.instructions || '',
            subject: test.subject || '',
            batch_id: test.batch_id || '',
            topic: test.topic || '',
            difficulty: test.difficulty || 'medium',
            category: test.category || 'mock_exam',
            duration_minutes: test.duration_minutes || 45,
            total_marks: test.total_marks || 100,
            pass_percentage: test.pass_percentage || 40,
            max_attempts: test.max_attempts || 1,
            randomize_questions: test.randomize_questions !== false,
            randomize_options: test.randomize_options !== false,
            negative_marking: test.negative_marking !== false,
            negative_mark_penalty: test.negative_mark_penalty || 0.25,
            proctoring_config: test.proctoring_config || formData.proctoring_config,
            status: test.status || 'draft',
            results_published: Boolean(test.results_published),
            allow_instant_result: test.allow_instant_result !== false,
            show_explanations: test.show_explanations !== false
          });
          setQuestions(test.questions || []);
        } catch (err) {
          alert('Failed to load existing test: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
      loadExisting();
    }
  }, [id, isEditing]);

  const handleSave = async (status = null) => {
    if (!formData.title.trim() || !formData.subject.trim()) {
      alert('Please provide a Title and Subject.');
      setActiveTab('general');
      return;
    }

    if (!formData.batch_id) {
      alert('Please select a Target Batch for this mock exam.');
      setActiveTab('general');
      return;
    }

    if (questions.length === 0) {
      if (!window.confirm('This test has 0 questions. Save anyway?')) return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        status: status || formData.status,
        questions
      };

      if (isEditing) {
        await api.updateMockTest(id, payload);
        alert('Mock test updated successfully!');
      } else {
        await api.createMockTest(payload);
        alert('Mock test created successfully!');
      }
      navigate('/teacher/mock-tests');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add Manual Question
  const handleAddManualQuestion = () => {
    if (!newQ.question_text.trim()) {
      alert('Question prompt cannot be empty.');
      return;
    }

    setQuestions(prev => [
      ...prev,
      {
        ...newQ,
        id: `manual-q-${Date.now()}`,
        order_index: prev.length + 1
      }
    ]);

    setManualModalOpen(false);
    setNewQ(initialNewQ);
  };

  const handleBulkImportSuccess = (importedList) => {
    if (Array.isArray(importedList) && importedList.length > 0) {
      const mapped = importedList.map(q => ({
        ...q,
        question_text: q.question_text,
        question_type: q.question_type || q.questionType || 'mcq_single',
        options: Array.isArray(q.options) ? q.options : [],
        answer_key: q.answer_key || { correct_index: q.correct_option_index ?? 0 },
        marks: parseFloat(q.marks) || 4,
        negative_marks: parseFloat(q.negative_marks) || 0,
        explanation: q.explanation || '',
        topic: q.topic || '',
        difficulty: (q.difficulty || 'medium').toLowerCase(),
        expected_answer: q.expected_answer || q.expectedAnswer || null,
        evaluation_criteria: q.evaluation_criteria || q.evaluationCriteria || null,
        programming_language: q.programming_language || q.programmingLanguage || 'javascript',
        starter_code: q.starter_code || q.starterCode || null,
        time_limit: parseFloat(q.time_limit || q.timeLimit || 2.0),
        memory_limit: parseInt(q.memory_limit || q.memoryLimit || 128, 10),
        test_cases: q.test_cases || q.testCases || []
      }));
      setQuestions(prev => [...prev, ...mapped]);
    }
  };

  const handleBankSelect = (selectedList) => {
    if (Array.isArray(selectedList) && selectedList.length > 0) {
      const mapped = selectedList.map(q => ({
        ...q,
        question_text: q.question_text,
        question_type: q.question_type || q.questionType || 'mcq_single',
        options: Array.isArray(q.options) ? q.options : [],
        answer_key: q.answer_key || { correct_index: q.correct_option_index ?? 0 },
        marks: parseFloat(q.marks) || 4,
        negative_marks: parseFloat(q.negative_marks) || 0,
        explanation: q.explanation || '',
        topic: q.topic || '',
        difficulty: (q.difficulty || 'medium').toLowerCase(),
        expected_answer: q.expected_answer || q.expectedAnswer || null,
        evaluation_criteria: q.evaluation_criteria || q.evaluationCriteria || null,
        programming_language: q.programming_language || q.programmingLanguage || 'javascript',
        starter_code: q.starter_code || q.starterCode || null,
        time_limit: parseFloat(q.time_limit || q.timeLimit || 2.0),
        memory_limit: parseInt(q.memory_limit || q.memoryLimit || 128, 10),
        test_cases: q.test_cases || q.testCases || []
      }));
      setQuestions(prev => [...prev, ...mapped]);
    }
  };

  // Open AI Modal with form sync and status check
  const handleOpenAiModal = async () => {
    setAiForm(prev => ({
      ...prev,
      subject: formData.subject || prev.subject || 'Computer Science',
      topic: formData.topic || formData.title || prev.topic || 'General Assessment'
    }));
    setAiError(null);
    setAiModalOpen(true);
    try {
      const status = await api.getAiStatus();
      setAiStatus(status);
    } catch (e) {
      // ignore
    }
  };

  // Re-check / Initialize Ollama from within Test Studio
  const handleConnectOllama = async () => {
    setInitializingOllama(true);
    setAiError(null);
    try {
      await api.initOllama();
      const status = await api.getAiStatus();
      setAiStatus(status);
    } catch (err) {
      setAiError('Failed to initialize Ollama: ' + err.message);
    } finally {
      setInitializingOllama(false);
    }
  };

  // Run AI Question Generator
  const handleGenerateAi = async () => {
    if (!aiForm.topic?.trim()) {
      setAiError('Please enter a Topic / Concept Area.');
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await api.generateAiMockTestQuestions(aiForm);
      const generated = res.questions || res.data?.questions || [];
      if (generated.length === 0) {
        throw new Error('AI returned an empty question list. Try adjusting the topic or syllabus snippet.');
      }
      setAiPreviewQuestions(generated);
      setAiModelUsed(res.model_used || res.data?.model_used || null);
    } catch (err) {
      setAiError(err.message || 'AI Question Generation failed. You can also write questions manually.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Accept AI Questions into Test
  const handleAcceptAiQuestions = () => {
    setQuestions(prev => [
      ...prev,
      ...aiPreviewQuestions.map((q, i) => ({
        ...q,
        order_index: prev.length + i + 1
      }))
    ]);
    setAiPreviewQuestions([]);
    setAiModalOpen(false);
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading Test Studio...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/teacher/mock-tests" className="btn btn-ghost" style={{ padding: '0.4rem', color: '#64748B' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
              EXAMINATION STUDIO
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
              {isEditing ? 'Edit Mock Test' : 'Create New Examination'}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="btn btn-secondary"
            style={{ fontWeight: 600 }}
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="btn btn-primary"
            style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Publish Test'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--color-border)',
        marginBottom: '1.75rem'
      }}>
        {[
          { id: 'general', label: '1. Test Configuration', icon: FileText },
          { id: 'proctoring', label: '2. Integrity & Proctoring', icon: Camera },
          { id: 'questions', label: `3. Questions Bank (${questions.length})`, icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--color-orange-dark)' : 'var(--color-text-secondary)',
                borderBottom: isActive ? '3px solid var(--color-orange)' : '3px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------------
          TAB 1: GENERAL CONFIGURATION
      --------------------------------------------------------------------- */}
      {activeTab === 'general' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.25rem' }}>
            Basic Examination Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Test Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Computer Networks Mid-Term All-India Mock 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.92rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Summary of topics covered, target audience, and learning objectives..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Subject *
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science Fundamentals, CS101"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Target Batch *
              </label>
              <select
                id="target-batch-select"
                value={formData.batch_id || ''}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  background: '#FFFFFF'
                }}
              >
                {batches.length === 0 ? (
                  <option value="" disabled>No options</option>
                ) : (
                  <>
                    <option value="">-- Select Target Batch --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code || b.department || 'Active'})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Topic
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Duration (Minutes) *
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormData({ ...formData, duration_minutes: mins })}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '5px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: formData.duration_minutes === mins ? '2px solid var(--color-orange, #F97316)' : '1px solid var(--color-border, #E2E8F0)',
                      background: formData.duration_minutes === mins ? '#FFF7ED' : '#FFFFFF',
                      color: formData.duration_minutes === mins ? '#C2410C' : 'inherit'
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="5"
                max="360"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 45 })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  background: '#FFFFFF'
                }}
              >
                <option value="mock_exam">All-India Mock Exam</option>
                <option value="practice">Practice Assessment</option>
                <option value="interview_prep">Interview Technical Screening</option>
                <option value="subject_test">Subject Class Test</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  background: '#FFFFFF'
                }}
              >
                <option value="beginner">Beginner</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Pass Percentage (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.pass_percentage}
                onChange={(e) => setFormData({ ...formData, pass_percentage: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Max Allowed Attempts per Candidate
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.max_attempts}
                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value, 10) })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Negative Marking Penalty (Marks deducted per incorrect MCQ)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formData.negative_mark_penalty}
                onChange={(e) => setFormData({ ...formData, negative_mark_penalty: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Candidate Exam Instructions
              </label>
              <textarea
                rows={4}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TAB 2: INTEGRITY & PROCTORING
      --------------------------------------------------------------------- */}
      {activeTab === 'proctoring' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
            Automated Proctoring & Security Safeguards
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Configure client-side anomaly detection. Indicators are collected to support faculty review and will not automatically impose penalties without human verification.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                key: 'webcam_required',
                title: 'Enforce Webcam Presence Verification',
                desc: 'Candidate must provide camera access before entering the examination.'
              },
              {
                key: 'face_detection',
                title: 'Face Detection Model',
                desc: 'Runs local computer vision check on camera frames without uploading video to server.'
              },
              {
                key: 'multi_face_warning',
                title: 'Multiple Faces Warning',
                desc: 'Warn candidate and log event if more than one face is persistently detected in frame.'
              },
              {
                key: 'face_absence_warning',
                title: 'Face Absence Alert',
                desc: 'Warn candidate if face is absent from frame for longer than 5 seconds.'
              },
              {
                key: 'fullscreen_required',
                title: 'Fullscreen Examination Mode',
                desc: 'Enforce browser full-screen mode and log exit incidents.'
              },
              {
                key: 'tab_switch_warning',
                title: 'Window Blur & Tab Switch Tracking',
                desc: 'Detect and record when candidate minimizes or navigates away from exam window.'
              }
            ].map(item => {
              const checked = Boolean(formData.proctoring_config?.[item.key]);
              return (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'var(--color-bg-alt)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-navy)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      {item.desc}
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setFormData({
                      ...formData,
                      proctoring_config: {
                        ...formData.proctoring_config,
                        [item.key]: e.target.checked
                      }
                    })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TAB 3: QUESTIONS BANK & AI GENERATOR
      --------------------------------------------------------------------- */}
      {activeTab === 'questions' && (
        <div>
          {/* Action Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FFFFFF',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-navy)' }}>
                Questions in Examination ({questions.length})
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Calculated Total Marks: <strong>{questions.reduce((acc, q) => acc + parseFloat(q.marks || 0), 0)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setBankModalOpen(true)}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Layers size={16} />
                <span>From Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  color: '#2563EB',
                  borderColor: '#BFDBFE'
                }}
              >
                <FileSpreadsheet size={16} />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAiModal}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  color: 'var(--color-orange-dark)',
                  borderColor: 'var(--color-orange)'
                }}
              >
                <Sparkles size={16} />
                <span>Generate AI</span>
              </button>

              <button
                type="button"
                onClick={() => setManualModalOpen(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Plus size={16} />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '4rem 2rem',
              textAlign: 'center'
            }}>
              <Layers size={44} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)' }}>No Questions Added Yet</h3>
              <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0.4rem auto 1.5rem' }}>
                Use our AI Question Generator to create questions from your syllabus, or write them manually.
              </p>
              <button onClick={handleOpenAiModal} className="btn btn-primary">
                <Sparkles size={16} /> Launch AI Generator
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-navy)' }}>
                        Q{idx + 1}.
                      </span>
                      <span style={{
                        background: '#EFF6FF',
                        color: '#2563EB',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {q.question_type}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        +{q.marks} Marks • -{q.negative_marks} Neg.
                      </span>
                    </div>

                    <button
                      onClick={() => removeQuestion(idx)}
                      className="btn btn-ghost"
                      style={{ color: '#EF4444', padding: '0.2rem' }}
                      title="Remove question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
                    {q.question_text}
                  </div>

                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.84rem' }}>
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          style={{
                            padding: '0.4rem 0.6rem',
                            background: q.answer_key?.correct_index === oIdx ? '#ECFDF5' : '#F8FAFC',
                            borderRadius: '4px',
                            border: q.answer_key?.correct_index === oIdx ? '1px solid #10B981' : '1px solid #E2E8F0',
                            color: q.answer_key?.correct_index === oIdx ? '#065F46' : 'var(--color-text-secondary)',
                            fontWeight: q.answer_key?.correct_index === oIdx ? 600 : 400
                          }}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------
          AI QUESTION GENERATOR MODAL
      --------------------------------------------------------------------- */}
      {aiModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '650px',
            width: '100%',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--color-orange)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                  AI Question Generator
                </h3>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.2rem' }}>
                <X size={18} />
              </button>
            </div>

            {/* AI Engine Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              background: aiStatus?.available ? '#F0FDF4' : '#FEF3C7',
              border: `1px solid ${aiStatus?.available ? '#BBF7D0' : '#FDE68A'}`,
              color: aiStatus?.available ? '#166534' : '#92400E'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: aiStatus?.available ? '#22C55E' : '#F59E0B',
                  display: 'inline-block'
                }}></span>
                <span>
                  {aiStatus?.available
                    ? (aiStatus.is_cloud
                        ? `Cloud AI Active: ${aiStatus.model} (${aiStatus.provider || 'Groq'})`
                        : `Ollama Active: ${aiStatus.model || 'qwen2.5:0.5b'} (${aiStatus.endpoint || 'http://localhost:11434'})`)
                    : (aiStatus?.status_message || 'Checking AI service...')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConnectOllama}
                disabled={initializingOllama}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
                title="Refresh connection status"
              >
                <RefreshCw size={12} className={initializingOllama ? 'spin' : ''} />
                <span>{initializingOllama ? 'Connecting...' : 'Refresh'}</span>
              </button>
            </div>

            {/* In-Modal Error Alert Banner */}
            {aiError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem'
              }}>
                <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <strong>Generation Error:</strong> {aiError}
                </div>
                <button
                  onClick={() => setAiError(null)}
                  style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={aiForm.subject}
                    onChange={(e) => setAiForm({ ...aiForm, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Topic / Concept Area *
                  </label>
                  <input
                    type="text"
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Reference Material / Syllabus Snippet (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste lecture notes, syllabus bullet points, or reference text..."
                  value={aiForm.syllabus}
                  onChange={(e) => setAiForm({ ...aiForm, syllabus: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={aiForm.count}
                    onChange={(e) => setAiForm({ ...aiForm, count: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Target Difficulty
                  </label>
                  <select
                    value={aiForm.difficulty}
                    onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateAi}
                disabled={aiGenerating}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.5rem'
                }}
              >
                {aiGenerating ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    <span>Generating with LinkTest AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Structured Questions</span>
                  </>
                )}
              </button>

              {/* Preview generated questions */}
              {aiPreviewQuestions.length > 0 && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                      Generated Preview ({aiPreviewQuestions.length} Questions Ready)
                    </div>
                    {aiModelUsed && (
                      <span style={{ fontSize: '0.75rem', color: '#166534', background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        Engine: {aiModelUsed}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {aiPreviewQuestions.map((q, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>{idx + 1}. {q.question_text}</div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem' }}>
                          Key: {q.answer_key?.correct_index !== undefined ? q.options[q.answer_key.correct_index] : 'Verified'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAcceptAiQuestions}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem', fontWeight: 800, background: '#10B981', borderColor: '#10B981' }}
                  >
                    Accept All {aiPreviewQuestions.length} Questions into Test
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          MANUAL QUESTION ADD MODAL
      --------------------------------------------------------------------- */}
      {manualModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '620px',
            width: '100%',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                Author New Question
              </h3>
              <button onClick={() => setManualModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.2rem' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Question Type
                </label>
                <select
                  value={newQ.question_type}
                  onChange={(e) => setNewQ({ ...newQ, question_type: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                >
                  <option value="mcq_single">Single-Choice MCQ</option>
                  <option value="mcq_multiple">Multiple-Select MCQ</option>
                  <option value="true_false">True / False</option>
                  <option value="long_answer">Long Answer</option>
                  <option value="coding">Coding Question</option>
                  <option value="fill_blank">Fill in the Blanks</option>
                  <option value="numerical">Numerical Value</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="subjective">Subjective / Code</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Question Prompt *
                </label>
                <textarea
                  rows={3}
                  value={newQ.question_text}
                  onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })}
                  placeholder="Enter clear, concise question statement..."
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Options for MCQ */}
              {['mcq_single', 'mcq_multiple'].includes(newQ.question_type) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Options (Select the correct answer key)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {newQ.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type={newQ.question_type === 'mcq_single' ? 'radio' : 'checkbox'}
                          name="correct_opt"
                          checked={newQ.question_type === 'mcq_single'
                            ? newQ.answer_key?.correct_index === oIdx
                            : (newQ.answer_key?.correct_indices || []).includes(oIdx)
                          }
                          onChange={() => {
                            if (newQ.question_type === 'mcq_single') {
                              setNewQ({ ...newQ, answer_key: { correct_index: oIdx } });
                            } else {
                              const curr = newQ.answer_key?.correct_indices || [];
                              const next = curr.includes(oIdx) ? curr.filter(i => i !== oIdx) : [...curr, oIdx];
                              setNewQ({ ...newQ, answer_key: { correct_indices: next } });
                            }
                          }}
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const nextOpts = [...newQ.options];
                            nextOpts[oIdx] = e.target.value;
                            setNewQ({ ...newQ, options: nextOpts });
                          }}
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* True/False Radio */}
              {newQ.question_type === 'true_false' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Correct Answer
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label>
                      <input
                        type="radio"
                        checked={newQ.answer_key?.correct_value === true}
                        onChange={() => setNewQ({ ...newQ, answer_key: { correct_value: true } })}
                      /> TRUE
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={newQ.answer_key?.correct_value === false}
                        onChange={() => setNewQ({ ...newQ, answer_key: { correct_value: false } })}
                      /> FALSE
                    </label>
                  </div>
                </div>
              )}

              {/* Numerical Input */}
              {newQ.question_type === 'numerical' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Target Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newQ.answer_key?.target_value || ''}
                      onChange={(e) => setNewQ({ ...newQ, answer_key: { ...newQ.answer_key, target_value: parseFloat(e.target.value) } })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Tolerance (±)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newQ.answer_key?.tolerance || 0}
                      onChange={(e) => setNewQ({ ...newQ, answer_key: { ...newQ.answer_key, tolerance: parseFloat(e.target.value) } })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              )}

              {/* Long Answer / Subjective Fields */}
              {['long_answer', 'subjective'].includes(newQ.question_type) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Expected Answer (Teacher Reference Model)
                    </label>
                    <textarea
                      rows={3}
                      value={newQ.expected_answer || ''}
                      onChange={(e) => setNewQ({ ...newQ, expected_answer: e.target.value })}
                      placeholder="Outline expected key concepts, steps, or standard answer..."
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Evaluation Criteria (Grading Rubric)
                    </label>
                    <textarea
                      rows={3}
                      value={newQ.evaluation_criteria || ''}
                      onChange={(e) => setNewQ({ ...newQ, evaluation_criteria: e.target.value })}
                      placeholder="- Correct concept&#10;- Important terminology&#10;- Explanation quality&#10;- Relevant example"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              )}

              {/* Coding Question Fields */}
              {newQ.question_type === 'coding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Programming Language
                      </label>
                      <select
                        value={newQ.programming_language || 'javascript'}
                        onChange={(e) => setNewQ({ ...newQ, programming_language: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      >
                        <option value="javascript">JavaScript</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Time Limit (s)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={newQ.time_limit || 2.0}
                        onChange={(e) => setNewQ({ ...newQ, time_limit: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Memory Limit (MB)
                      </label>
                      <input
                        type="number"
                        step="16"
                        min="32"
                        max="512"
                        value={newQ.memory_limit || 128}
                        onChange={(e) => setNewQ({ ...newQ, memory_limit: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Starter Code *
                    </label>
                    <textarea
                      rows={4}
                      value={newQ.starter_code || ''}
                      onChange={(e) => setNewQ({ ...newQ, starter_code: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px', fontFamily: 'monospace', background: '#F8FAFC' }}
                    />
                  </div>

                  {/* Test Cases Builder */}
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                        Test Cases ({(newQ.test_cases || []).length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewQ({
                          ...newQ,
                          test_cases: [...(newQ.test_cases || []), { input: '', expected_output: '', is_hidden: false }]
                        })}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      >
                        + Add Test Case
                      </button>
                    </div>

                    {(newQ.test_cases || []).map((tc, tcIdx) => (
                      <div key={tcIdx} style={{ background: tc.is_hidden ? '#FFFBEB' : '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '0.5rem', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 700 }}>#{tcIdx + 1} {tc.is_hidden ? '(Hidden from students)' : '(Public)'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={tc.is_hidden}
                                onChange={(e) => {
                                  const updated = [...newQ.test_cases];
                                  updated[tcIdx] = { ...updated[tcIdx], is_hidden: e.target.checked };
                                  setNewQ({ ...newQ, test_cases: updated });
                                }}
                              />
                              Hidden
                            </label>
                            {newQ.test_cases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewQ({
                                    ...newQ,
                                    test_cases: newQ.test_cases.filter((_, idx) => idx !== tcIdx)
                                  });
                                }}
                                style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                          <input
                            type="text"
                            placeholder="Input (e.g. 2 3)"
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...newQ.test_cases];
                              updated[tcIdx] = { ...updated[tcIdx], input: e.target.value };
                              setNewQ({ ...newQ, test_cases: updated });
                            }}
                            style={{ padding: '0.35rem', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                          />
                          <input
                            type="text"
                            placeholder="Expected Output (e.g. 5)"
                            value={tc.expected_output}
                            onChange={(e) => {
                              const updated = [...newQ.test_cases];
                              updated[tcIdx] = { ...updated[tcIdx], expected_output: e.target.value };
                              setNewQ({ ...newQ, test_cases: updated });
                            }}
                            style={{ padding: '0.35rem', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marks & Penalty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Marks (+)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newQ.marks}
                    onChange={(e) => setNewQ({ ...newQ, marks: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Negative Marks (-)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newQ.negative_marks}
                    onChange={(e) => setNewQ({ ...newQ, negative_marks: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Detailed Solution & Explanation
                </label>
                <textarea
                  rows={2}
                  value={newQ.explanation}
                  onChange={(e) => setNewQ({ ...newQ, explanation: e.target.value })}
                  placeholder="Explains why this answer is correct..."
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '4px', fontFamily: 'inherit' }}
                />
              </div>

              <button
                onClick={handleAddManualQuestion}
                className="btn btn-primary"
                style={{ padding: '0.75rem', fontWeight: 800, marginTop: '0.5rem' }}
              >
                Add Question to Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      <BulkQuestionImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleBulkImportSuccess}
      />

      {/* Select From Question Bank Modal */}
      <QuestionBankSelectorModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        onSelectQuestions={handleBankSelect}
      />
    </div>
  );
}
export default TeacherTestBuilderPage;
