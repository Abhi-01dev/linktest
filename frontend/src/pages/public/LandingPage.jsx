import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  TrendingUp,
  Brain,
  Code2,
  Database,
  Cloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedCourses() {
      try {
        const list = await api.getCourses();
        setCourses(list.slice(0, 3));
      } catch (err) {
        console.error('Failed to load courses on landing:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeaturedCourses();
  }, []);

  const categories = [
    { name: 'Web Development', icon: Code2, count: '3 Lessons', desc: 'React, Node.js, Express & REST APIs' },
    { name: 'Computer Science', icon: Layers, count: '3 Lessons', desc: 'DSA, Big-O Analysis & Data Structures' },
    { name: 'AI & Data Science', icon: Brain, count: '3 Lessons', desc: 'Python, Machine Learning & Local LLMs' },
    { name: 'Cloud & DevOps', icon: Cloud, count: '3 Lessons', desc: 'Docker, Containerization & CI/CD Pipelines' },
    { name: 'System Architecture', icon: Database, count: '3 Lessons', desc: 'High Scalability, Caching & Distributed Systems' }
  ];

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section
        style={{
          background: 'radial-gradient(circle at 50% 10%, rgba(249, 115, 22, 0.08) 0%, transparent 60%), #FFFFFF',
          borderBottom: '1px solid var(--color-border)',
          padding: '4.5rem 0 5rem',
          position: 'relative'
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: '#FFEDD5',
              border: '1px solid #FED7AA',
              color: '#C2410C',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '1.75rem'
            }}
          >
            <Sparkles size={15} style={{ color: '#F97316' }} />
            <span>AI-POWERED LEARNING & ASSESSMENT PLATFORM</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              color: 'var(--color-navy)'
            }}
          >
            Your Learning Journey, <span style={{ color: 'var(--color-orange)' }}>Connected.</span>
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
              maxWidth: '720px',
              margin: '0 auto 2.5rem'
            }}
          >
            Learn Smarter. Practice Better. Test Your Progress. LinkTest connects structured computer science courses with an intelligent local AI tutor and server-graded assessments.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
              <span>{isAuthenticated ? 'Go to My Dashboard' : 'Get Started Free'}</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/courses" className="btn btn-outline btn-lg">
              <BookOpen size={18} />
              <span>Explore Courses</span>
            </Link>
            <Link to="/ai-tutor" className="btn btn-secondary btn-lg">
              <Sparkles size={18} style={{ color: '#FB923C' }} />
              <span>Try AI Study Tutor</span>
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.5rem',
              marginTop: '4rem',
              padding: '1.75rem',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-navy)' }}>5+</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Core CS Curriculum Tracks</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-orange)' }}>qwen3:8b</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Local Ollama AI Tutor</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-navy)' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Server-Validated Quizzes</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10B981' }}>Free</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Open Platform Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES SECTION */}
      <section style={{ padding: '5rem 0', background: 'var(--color-bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>
              Why LinkTest
            </span>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>
              Engineered for Genuine Learning & Assessment
            </h2>
            <p>
              Designed specifically for engineering students, bootcamp learners, and competitive exam test-takers seeking solid fundamentals.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem'
            }}
          >
            {/* Feature 1: AI Tutor */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-md)',
                  background: '#FFEDD5',
                  color: '#EA580C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <Sparkles size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem' }}>AI Study Tutor</h3>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                Receive instant, beginner-friendly explanations with analogies, code breakdowns, and follow-up guidance powered by local Ollama (qwen3:8b) with zero paid API lock-in.
              </p>
            </div>

            {/* Feature 2: Validated MCQ Engine */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-md)',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <Award size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem' }}>Secure MCQ Assessments</h3>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                Questions are scored entirely on the server. Correct answers are never sent to browser memory prior to submission, followed by instant explanations.
              </p>
            </div>

            {/* Feature 3: Progress Tracking */}
            <div className="card card-interactive" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-md)',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <TrendingUp size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem' }}>Persistent Progress</h3>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                Mark lessons complete, track completion percentages in real-time, and preserve your quiz attempt history across every course track.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CURRICULUM CATEGORIES */}
      <section style={{ padding: '5rem 0', background: '#FFFFFF', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <span className="badge badge-navy" style={{ marginBottom: '0.5rem' }}>
                Curriculum
              </span>
              <h2 style={{ fontSize: '2rem' }}>Explore Course Tracks</h2>
            </div>
            <Link to="/courses" className="btn btn-outline btn-sm">
              <span>View All Tracks</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={i}
                  to={`/courses?category=${encodeURIComponent(cat.name)}`}
                  className="card card-interactive"
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      color: 'var(--color-orange)'
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>{cat.name}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', flex: 1 }}>
                    {cat.desc}
                  </p>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-orange-dark)' }}>
                    {cat.count} • Interactive
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. AI TUTOR SHOWCASE SPOTLIGHT */}
      <section
        style={{
          padding: '5.5rem 0',
          background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-dark) 100%)',
          color: '#FFFFFF'
        }}
      >
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(249, 115, 22, 0.2)',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  color: '#FB923C',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem'
                }}
              >
                <Sparkles size={14} />
                <span>INTELLIGENT STUDY COMPANION</span>
              </div>
              <h2 style={{ fontSize: '2.4rem', color: '#FFFFFF', marginBottom: '1rem', lineHeight: 1.2 }}>
                Stuck on a concept? <br />
                Ask LinkTest AI Tutor.
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Whether it's dissecting algorithmic time complexity, demystifying React useEffect dependencies, or explaining container isolation, your AI Tutor is available 24/7.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#34D399' }} />
                  <span style={{ fontSize: '0.925rem', color: '#E2E8F0' }}>Runs on your local machine with Qwen 3 (8B)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#34D399' }} />
                  <span style={{ fontSize: '0.925rem', color: '#E2E8F0' }}>Step-by-step code breakdowns and intuitive analogies</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#34D399' }} />
                  <span style={{ fontSize: '0.925rem', color: '#E2E8F0' }}>Generate tailored practice quizzes on any subject</span>
                </div>
              </div>
              <Link to="/ai-tutor" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                <span>Open AI Study Tutor</span>
              </Link>
            </div>

            {/* Chat Preview Card Mockup */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                padding: '1.75rem',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                  <strong style={{ fontSize: '0.9rem' }}>LinkTest AI Tutor (qwen3:8b)</strong>
                </div>
                <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>Ollama Local</span>
              </div>

              {/* Sample Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ alignSelf: 'flex-end', background: 'var(--color-navy)', color: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '12px 12px 2px 12px', fontSize: '0.875rem', maxWidth: '85%' }}>
                  Can you explain the Big-O of Binary Search with a simple analogy?
                </div>
                <div style={{ alignSelf: 'flex-start', background: 'var(--color-bg-alt)', padding: '0.85rem 1.1rem', borderRadius: '12px 12px 12px 2px', fontSize: '0.875rem', maxWidth: '90%', lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: '0.35rem' }}>
                    💡 The Dictionary Analogy:
                  </p>
                  Imagine searching for "Osprey" in a 1,000-page dictionary. You open directly to the middle (page 500). If you land on "M", you discard pages 1–500 in one step! In just 10 cuts ($2^{10} \approx 1024$), you pinpoint any word. That's <strong>O(log n)</strong> logarithmic time!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section style={{ padding: '5rem 0', background: '#FFFFFF', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '680px' }}>
          <h2 style={{ fontSize: '2.3rem', marginBottom: '1rem' }}>
            Ready to Accelerate Your Tech Career?
          </h2>
          <p style={{ fontSize: '1.05rem', marginBottom: '2rem' }}>
            Join LinkTest today. Enroll in curated modules, test your skills with verified assessments, and learn with intelligent AI guidance.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
              <span>{isAuthenticated ? 'Go to My Dashboard' : 'Create Free Account'}</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/courses" className="btn btn-outline btn-lg">
              <span>Browse All Courses</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
