import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Search, BookOpen, Users, User, ArrowRight, Sparkles, Filter } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Web Development',
  'Computer Science',
  'AI & Data Science',
  'Cloud & DevOps',
  'System Architecture'
];

export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      try {
        const data = await api.getCourses({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: searchQuery
        });
        setCourses(data);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadCourses, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-orange">Course Catalogue</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            Explore Technical Curriculum
          </h1>
          <p style={{ fontSize: '1.05rem', maxWidth: '680px' }}>
            Structured, high-impact modules in Web Development, DSA, Artificial Intelligence, and DevOps designed for engineering excellence.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)'
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search courses by title, topic, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: active ? 'var(--color-navy)' : '#FFFFFF',
                    color: active ? '#FFFFFF' : 'var(--color-text-secondary)',
                    border: `1px solid ${active ? 'var(--color-navy)' : 'var(--color-border)'}`
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '2rem'
            }}
          >
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="card" style={{ height: '360px', padding: '1rem' }}>
                <div className="skeleton" style={{ height: '160px', marginBottom: '1rem' }} />
                <div className="skeleton" style={{ height: '20px', width: '40%', marginBottom: '0.75rem' }} />
                <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: '16px', width: '100%' }} />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              maxWidth: '540px',
              margin: '2rem auto'
            }}
          >
            <Filter size={36} style={{ color: 'var(--color-orange)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Courses Found</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              No courses matched your search query "{searchQuery}" in category "{selectedCategory}".
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="btn btn-outline btn-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '2rem'
            }}
          >
            {courses.map(course => (
              <div
                key={course.id}
                className="card card-interactive"
                style={{
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Course Image */}
                <div
                  style={{
                    height: '180px',
                    width: '100%',
                    background: 'var(--color-navy-dark)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516116211227-bbc0c25a0750?auto=format&fit=crop&w=800&q=80'}
                    alt={course.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.85rem',
                      left: '0.85rem'
                    }}
                  >
                    <span className="badge badge-orange" style={{ boxShadow: 'var(--shadow-sm)' }}>
                      {course.category}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      marginBottom: '0.65rem',
                      lineHeight: 1.35
                    }}
                  >
                    {course.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      marginBottom: '1.25rem',
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {course.description}
                  </p>

                  {/* Metadata Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--color-border)',
                      marginBottom: '1.25rem',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={14} />
                      <span>{course.instructor_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                      <BookOpen size={14} style={{ color: 'var(--color-orange)' }} />
                      <span>{course.lessons_count || 3} Lessons</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/courses/${course.id}`}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <span>View Course & Syllabus</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
