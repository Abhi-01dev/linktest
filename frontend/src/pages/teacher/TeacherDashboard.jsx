import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  Video,
  Megaphone,
  Clock,
  ArrowRight,
  PlusCircle,
  GraduationCap
} from 'lucide-react';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getTeacherDashboard();
        setData(res);
      } catch (err) {
        showToast(err.message || 'Failed to load teacher dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summary = data?.summary || {};
  const todaySchedule = data?.today_schedule || [];
  const assignedClasses = data?.assigned_classes || [];
  const upcomingLive = data?.upcoming_live_classes || [];
  const announcements = data?.recent_announcements || [];

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Faculty Command Center
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0.2rem 0 0.5rem', color: '#FFFFFF' }}>
            Welcome back, {user?.full_name}!
          </h1>
          <p style={{ color: '#DBEAFE', fontSize: '0.92rem', maxWidth: '600px', margin: 0 }}>
            Here is your daily teaching schedule, pending homework submissions for evaluation, and scheduled live lectures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/teacher/attendance" className="btn btn-outline" style={{ background: '#FFFFFF', color: '#1E3A8A', borderColor: '#FFFFFF' }}>
            <ClipboardCheck size={16} />
            <span>Mark Roll Call</span>
          </Link>
          <Link to="/teacher/assignments" className="btn btn-primary" style={{ background: '#F97316', borderColor: '#F97316' }}>
            <PlusCircle size={16} />
            <span>New Assignment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#2563EB', marginBottom: '0.5rem' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Classes</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A' }}>
            {summary.assigned_classes_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#16A34A', marginBottom: '0.5rem' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Today's Periods</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#16A34A' }}>
            {summary.today_classes_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#D97706', marginBottom: '0.5rem' }}>
            <FileText size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Pending Grading</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#D97706' }}>
            {summary.pending_grading_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#9333EA', marginBottom: '0.5rem' }}>
            <Video size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Upcoming Live</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#9333EA' }}>
            {summary.upcoming_live_sessions || 0}
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Live Classes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Today's Schedule */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: '#2563EB' }} />
              <span>Today's Class Schedule</span>
            </h3>
            <Link to="/teacher/timetable" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>
              Full Week →
            </Link>
          </div>

          {todaySchedule.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No periods scheduled for today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todaySchedule.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {entry.subject_name || 'Subject'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {entry.class_name} {entry.batch_name ? `(${entry.batch_name})` : ''} {entry.room ? `• ${entry.room}` : ''}
                    </div>
                  </div>
                  <span style={{ padding: '0.25rem 0.6rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Classes Quick View */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} style={{ color: '#16A34A' }} />
              <span>Assigned Divisions</span>
            </h3>
            <Link to="/teacher/classes" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>
              View Rosters →
            </Link>
          </div>

          {assignedClasses.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No subjects or classes assigned yet. Contact administrator.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {assignedClasses.map((ac) => (
                <div
                  key={ac.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>
                      {ac.subject_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.2rem' }}>
                      {ac.class_name} {ac.batch_name ? `• ${ac.batch_name}` : ''}
                    </div>
                  </div>
                  <Link
                    to="/teacher/attendance"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#FFFFFF', borderColor: '#BBF7D0', color: '#166534' }}
                  >
                    Attendance
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default TeacherDashboard;
