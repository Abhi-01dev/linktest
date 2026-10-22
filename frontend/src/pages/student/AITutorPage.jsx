import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  Send,
  Trash2,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  Copy,
  Lightbulb,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export function AITutorPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I am **LinkTest AI Tutor**, ready to mentor and guide your studies.

I can help you:
• Break down complicated computer science & programming concepts with intuitive analogies.
• Walk through algorithms, data structures, and code step-by-step.
• Generate practice multiple-choice questions on any technical topic.

What concept would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [initializingOllama, setInitializingOllama] = useState(false);
  const messagesEndRef = useRef(null);

  const starterPrompts = [
    'Explain the Big-O time complexity of Binary Search with a simple analogy.',
    'How does React useState and virtual DOM reconciliation work under the hood?',
    'What is the difference between Docker containers and Virtual Machines?',
    'Generate 3 practice MCQs on Hash Tables and collision resolution.'
  ];

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const status = await api.getAiStatus();
      setAiStatus(status);
    } catch (err) {
      setAiStatus({
        available: false,
        model: 'qwen3:8b',
        endpoint: 'http://localhost:11434',
        status_message: 'Cannot reach Ollama service.'
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInitOllama = async () => {
    setInitializingOllama(true);
    try {
      const res = await api.initOllama();
      if (res?.success) {
        showToast(res.message || 'Ollama connected successfully!', 'success');
        await checkStatus();
      } else {
        showToast(res?.message || 'Ollama service is still offline.', 'warning');
      }
    } catch (err) {
      showToast('Ollama service unreachable. Ensure "ollama serve" is running.', 'error');
    } finally {
      setInitializingOllama(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAi(text);
      const assistantMsg = {
        id: 'asst-' + Date.now(),
        role: 'assistant',
        content: res?.reply || res?.response || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ AI Service Note: ${err.message || 'Unable to connect to AI tutor'}.\n\nIf you are running locally, ensure Ollama is running ('ollama serve'). If deployed in production, ensure CLOUD_AI_API_KEY is configured in backend environment variables.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation cleared. How can I help you learn today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    showToast('Chat history cleared', 'info');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        {/* Header and Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: '#FFEDD5',
                  color: 'var(--color-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={20} />
              </div>
              <h1 style={{ fontSize: '1.75rem' }}>LinkTest AI Study Tutor</h1>
            </div>
            <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Intelligent concept breakdowns, practice quizzes, and 24/7 technical mentoring.
            </p>
          </div>

          {/* AI Diagnostic Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: aiStatus?.available ? '#ECFDF5' : '#FFFBEB',
                color: aiStatus?.available ? '#065F46' : '#92400E',
                border: `1px solid ${aiStatus?.available ? '#A7F3D0' : '#FDE68A'}`
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: aiStatus?.available ? '#10B981' : '#F59E0B'
                }}
              />
              <span>
                {aiStatus?.available
                  ? (aiStatus.is_cloud ? `Cloud AI (${aiStatus.provider || 'Groq'}) Active` : `Ollama (${aiStatus.model}) Active`)
                  : (aiStatus?.is_cloud ? 'Cloud AI Offline' : 'AI Offline')}
              </span>
            </div>

            <button
              onClick={checkStatus}
              className="btn btn-outline btn-sm"
              title="Refresh AI Status"
              disabled={checkingStatus}
            >
              <RefreshCw size={14} className={checkingStatus ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleClearChat}
              className="btn btn-outline btn-sm"
              title="Clear Conversation"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Offline Diagnostic Alert (if Ollama or Cloud AI is not running) */}
        {aiStatus && !aiStatus.available && (
          <div
            style={{
              padding: '1rem 1.25rem',
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                {aiStatus.is_cloud ? 'Cloud AI Service Offline' : 'Local Ollama Service Not Detected'}
              </strong>
              {aiStatus.is_cloud ? (
                <span>
                  The backend is configured to use Cloud AI (<code>{aiStatus.provider}</code>: <code>{aiStatus.model}</code>).
                  <br />
                  {aiStatus.status_message || 'Please check that CLOUD_AI_API_KEY is valid and not rate-limited.'}
                </span>
              ) : (
                <span>
                  The backend is configured to connect to <code>{aiStatus.endpoint}</code> with model <code>{aiStatus.model}</code>.
                  <br />
                  1. Local development: Run <code>ollama serve</code> in your terminal and pull <code>ollama run {aiStatus.model || 'qwen2.5:0.5b'}</code>.
                  <br />
                  2. Cloud deployment: Add <code>CLOUD_AI_PROVIDER=groq</code> and <code>CLOUD_AI_API_KEY=your_key</code> in backend environment variables.
                </span>
              )}

              {!aiStatus.is_cloud && (
                <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleInitOllama}
                    disabled={initializingOllama}
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                  >
                    <RefreshCw size={14} className={initializingOllama ? 'animate-spin' : ''} />
                    <span>{initializingOllama ? 'Testing & Initializing...' : 'Initialize & Connect Ollama'}</span>
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#B45309' }}>
                    CLI: <code>npm run ollama:init</code>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Box Container */}
        <div
          className="card"
          style={{
            height: '560px',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {/* Message Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    gap: '0.75rem',
                    flexDirection: isUser ? 'row-reverse' : 'row'
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isUser ? 'var(--color-navy)' : 'var(--color-orange-gradient)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.2rem'
                    }}
                  >
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: isUser ? 'var(--color-navy)' : 'var(--color-bg-alt)',
                      color: isUser ? '#FFFFFF' : 'var(--color-text-primary)',
                      padding: '1rem 1.25rem',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '0.925rem',
                      lineHeight: 1.6,
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.5rem',
                        fontSize: '0.7rem',
                        color: isUser ? '#94A3B8' : 'var(--color-text-light)'
                      }}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          style={{ color: 'inherit', padding: 2 }}
                          title="Copy message"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  gap: '0.75rem',
                  maxWidth: '85%'
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--color-orange-gradient)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bot size={16} />
                </div>
                <div
                  style={{
                    background: 'var(--color-bg-alt)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '16px 16px 16px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.875rem'
                  }}
                >
                  <Sparkles size={16} style={{ color: 'var(--color-orange)' }} className="animate-spin" />
                  <span>Thinking & reasoning with Qwen...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter Suggestions Bar */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: '#FFFFFF',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-orange)', fontSize: '0.75rem', fontWeight: 700 }}>
              <Lightbulb size={13} />
              <span>Try asking:</span>
            </div>
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  padding: '0.25rem 0.65rem',
                  background: 'var(--color-bg-alt)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {prompt.length > 42 ? prompt.substring(0, 42) + '...' : prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: '#FFFFFF',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <textarea
              className="form-textarea"
              rows={1}
              placeholder="Ask any programming or computer science question (Shift+Enter for new line)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                resize: 'none',
                height: '46px',
                paddingTop: '0.7rem',
                borderRadius: 'var(--radius-md)'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{
                height: '46px',
                padding: '0 1.25rem',
                flexShrink: 0
              }}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
