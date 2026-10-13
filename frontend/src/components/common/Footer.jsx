import React from 'react';
import { Link } from 'react-router-dom';
import { LinkTestLogo } from './LinkTestLogo';
import { Heart, Sparkles, Shield, Terminal, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-navy-dark)',
        color: '#94A3B8',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '3.5rem',
        paddingBottom: '2.5rem',
        marginTop: 'auto'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem'
          }}
        >
          {/* Brand & Mission */}
          <div style={{ maxWidth: '320px' }}>
            <LinkTestLogo size="md" light={true} />
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              AI-powered learning, intelligent practice, and progress tracking engineered for Indian colleges, engineering institutes, and competitive tech careers.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#F97316' }}>
              <Sparkles size={14} />
              <span>Powered by Local Ollama & Qwen 3</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/courses" style={{ color: '#CBD5E1', transition: 'color 0.2s' }}>
                  Course Catalogue
                </Link>
              </li>
              <li>
                <Link to="/ai-tutor" style={{ color: '#CBD5E1', transition: 'color 0.2s' }}>
                  AI Study Tutor
                </Link>
              </li>
              <li>
                <Link to="/dashboard" style={{ color: '#CBD5E1', transition: 'color 0.2s' }}>
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/progress" style={{ color: '#CBD5E1', transition: 'color 0.2s' }}>
                  Performance Metrics
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Modules */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Learning Tracks
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
              <li style={{ color: '#94A3B8' }}>Full-Stack Web Development</li>
              <li style={{ color: '#94A3B8' }}>Data Structures & Algorithms</li>
              <li style={{ color: '#94A3B8' }}>Python for AI & LLMs</li>
              <li style={{ color: '#94A3B8' }}>Cloud DevOps & Docker</li>
              <li style={{ color: '#94A3B8' }}>System Architecture</li>
            </ul>
          </div>

          {/* Architecture & Engineering */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Security & Stack
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34D399' }}>
                <Shield size={14} />
                <span>Bcrypt & JWT Protected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60A5FA' }}>
                <Terminal size={14} />
                <span>PostgreSQL & Express API</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FB923C' }}>
                <Sparkles size={14} />
                <span>Zero-Answer Leakage Scoring</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.85rem'
          }}
        >
          <div>
            © {new Date().getFullYear()} <strong>LinkTest</strong>. All rights reserved. Built for Indian EdTech excellence.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', color: '#94A3B8' }}>
            <span>Learn Smarter. Practice Better. Test Your Progress.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
