import React, { useRef, useEffect } from 'react';
import { Play, Send, RotateCcw, Copy, Check, Terminal } from 'lucide-react';

export function CodeEditor({
  code,
  onChange,
  language = 'javascript',
  onLanguageChange,
  onRun,
  onSubmit,
  isRunning = false,
  isSubmitting = false
}) {
  const textareaRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  const lines = (code || '').split('\n');
  const lineCount = Math.max(lines.length, 12);

  const handleKeyDown = (e) => {
    // Support Tab key (insert 2 spaces instead of jumping focus)
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newCode = code.substring(0, selectionStart) + '  ' + code.substring(selectionEnd);
      onChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 2;
        }
      }, 0);
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const { selectionStart } = e.target;
      const currentLine = code.substring(0, selectionStart).split('\n').pop() || '';
      const match = currentLine.match(/^(\s+)/);
      if (match) {
        e.preventDefault();
        const indent = match[1];
        const newCode = code.substring(0, selectionStart) + '\n' + indent + code.substring(selectionStart);
        onChange(newCode);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 1 + indent.length;
          }
        }, 0);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #1E293B',
        background: '#0B0F19',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Editor Header / Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.65rem 1rem',
          background: '#111827',
          borderBottom: '1px solid #1F2937'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10B981' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
            <Terminal size={14} style={{ color: '#94A3B8' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>
              LinkTest Code Studio
            </span>
          </div>

          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#1F2937',
                color: '#E2E8F0',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '0.2rem 0.6rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
            </select>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-sm"
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.72rem',
              background: 'transparent',
              color: '#94A3B8',
              borderColor: '#374151',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            {copied ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={isRunning || isSubmitting}
              className="btn btn-sm"
              style={{
                padding: '0.3rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: '#16A34A',
                color: '#FFFFFF',
                borderColor: '#16A34A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Play size={12} fill="#FFFFFF" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          )}

          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isRunning || isSubmitting}
              className="btn btn-sm btn-primary"
              style={{
                padding: '0.3rem 0.95rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Send size={12} />
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Solution'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div style={{ display: 'flex', minHeight: '380px', maxHeight: '550px', position: 'relative' }}>
        {/* Line Numbers Column */}
        <div
          style={{
            userSelect: 'none',
            padding: '1rem 0.65rem 1rem 0.85rem',
            textAlign: 'right',
            color: '#4B5563',
            background: '#0F172A',
            borderRight: '1px solid #1E293B',
            fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
            fontSize: '0.85rem',
            lineHeight: '1.5rem',
            minWidth: '40px'
          }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            flex: 1,
            padding: '1rem',
            background: '#0B0F19',
            color: '#F1F5F9',
            fontFamily: 'Consolas, "Fira Code", Monaco, "Courier New", monospace',
            fontSize: '0.875rem',
            lineHeight: '1.5rem',
            border: 'none',
            outline: 'none',
            resize: 'none',
            overflowY: 'auto',
            tabSize: 2,
            whiteSpace: 'pre'
          }}
          placeholder={`// Write your ${language === 'python' ? 'Python' : 'JavaScript'} solution here...`}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
