import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Common Layout Elements
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoader } from './components/common/PageLoader';
import { TeacherLayout } from './components/teacher/TeacherLayout';
import { AdminLayout } from './components/admin/AdminLayout';

// Utility helper to lazy-load named component exports
const lazyNamed = (factory, name) => lazy(() => factory().then(m => ({ default: m[name] })));

// Public & Auth Pages (Lazy-loaded chunks)
const LandingPage = lazyNamed(() => import('./pages/public/LandingPage'), 'LandingPage');
const NotFoundPage = lazyNamed(() => import('./pages/public/NotFoundPage'), 'NotFoundPage');
const LoginPage = lazyNamed(() => import('./pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('./pages/auth/RegisterPage'), 'RegisterPage');
const VerifyEmailPage = lazyNamed(() => import('./pages/auth/VerifyEmailPage'), 'VerifyEmailPage');
const AcceptInvitePage = lazyNamed(() => import('./pages/auth/AcceptInvitePage'), 'AcceptInvitePage');
const ForgotPasswordPage = lazyNamed(() => import('./pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('./pages/auth/ResetPasswordPage'), 'ResetPasswordPage');
const CoursesPage = lazyNamed(() => import('./pages/courses/CoursesPage'), 'CoursesPage');
const CourseDetailPage = lazyNamed(() => import('./pages/courses/CourseDetailPage'), 'CourseDetailPage');

// Student Pages (Lazy-loaded chunks)
const StudentDashboard = lazyNamed(() => import('./pages/student/StudentDashboard'), 'StudentDashboard');
const StudentTimetablePage = lazyNamed(() => import('./pages/student/StudentTimetablePage'), 'StudentTimetablePage');
const StudentAttendancePage = lazyNamed(() => import('./pages/student/StudentAttendancePage'), 'StudentAttendancePage');
const StudentAssignmentsPage = lazyNamed(() => import('./pages/student/StudentAssignmentsPage'), 'StudentAssignmentsPage');
const StudentMaterialsPage = lazyNamed(() => import('./pages/student/StudentMaterialsPage'), 'StudentMaterialsPage');
const StudentLiveClassesPage = lazyNamed(() => import('./pages/student/StudentLiveClassesPage'), 'StudentLiveClassesPage');
const StudentAnnouncementsPage = lazyNamed(() => import('./pages/student/StudentAnnouncementsPage'), 'StudentAnnouncementsPage');
const StudentSupportTicketsPage = lazyNamed(() => import('./pages/student/StudentSupportTicketsPage'), 'StudentSupportTicketsPage');
const LessonViewerPage = lazyNamed(() => import('./pages/student/LessonViewerPage'), 'LessonViewerPage');
const AITutorPage = lazyNamed(() => import('./pages/student/AITutorPage'), 'AITutorPage');
const StudentProgressPage = lazyNamed(() => import('./pages/student/StudentProgressPage'), 'StudentProgressPage');
const ProfilePage = lazyNamed(() => import('./pages/student/ProfilePage'), 'ProfilePage');
const CodingChallengePage = lazyNamed(() => import('./pages/student/CodingChallengePage'), 'CodingChallengePage');

// Quiz Pages (Lazy-loaded chunks)
const QuizTakePage = lazyNamed(() => import('./pages/quizzes/QuizTakePage'), 'QuizTakePage');
const QuizResultPage = lazyNamed(() => import('./pages/quizzes/QuizResultPage'), 'QuizResultPage');

// Teacher Pages (Lazy-loaded chunks)
const TeacherDashboard = lazyNamed(() => import('./pages/teacher/TeacherDashboard'), 'TeacherDashboard');
const TeacherClassesPage = lazyNamed(() => import('./pages/teacher/TeacherClassesPage'), 'TeacherClassesPage');
const TeacherTimetablePage = lazyNamed(() => import('./pages/teacher/TeacherTimetablePage'), 'TeacherTimetablePage');
const TeacherAttendancePage = lazyNamed(() => import('./pages/teacher/TeacherAttendancePage'), 'TeacherAttendancePage');
const TeacherAssignmentsPage = lazyNamed(() => import('./pages/teacher/TeacherAssignmentsPage'), 'TeacherAssignmentsPage');
const TeacherMaterialsPage = lazyNamed(() => import('./pages/teacher/TeacherMaterialsPage'), 'TeacherMaterialsPage');
const TeacherLiveClassesPage = lazyNamed(() => import('./pages/teacher/TeacherLiveClassesPage'), 'TeacherLiveClassesPage');
const TeacherAnnouncementsPage = lazyNamed(() => import('./pages/teacher/TeacherAnnouncementsPage'), 'TeacherAnnouncementsPage');
const TeacherLeavePage = lazyNamed(() => import('./pages/teacher/TeacherLeavePage'), 'TeacherLeavePage');
const TeacherSyllabusPage = lazyNamed(() => import('./pages/teacher/TeacherSyllabusPage'), 'TeacherSyllabusPage');
const TeacherProfilePage = lazyNamed(() => import('./pages/teacher/TeacherProfilePage'), 'TeacherProfilePage');

// Admin Pages (Lazy-loaded chunks)
const AdminDashboard = lazyNamed(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminStudentsPage = lazyNamed(() => import('./pages/admin/AdminStudentsPage'), 'AdminStudentsPage');
const AdminTeachersPage = lazyNamed(() => import('./pages/admin/AdminTeachersPage'), 'AdminTeachersPage');
const AdminClassesPage = lazyNamed(() => import('./pages/admin/AdminClassesPage'), 'AdminClassesPage');
const AdminSubjectsPage = lazyNamed(() => import('./pages/admin/AdminSubjectsPage'), 'AdminSubjectsPage');
const AdminTimetablePage = lazyNamed(() => import('./pages/admin/AdminTimetablePage'), 'AdminTimetablePage');
const AdminAttendancePage = lazyNamed(() => import('./pages/admin/AdminAttendancePage'), 'AdminAttendancePage');
const AdminLiveClassesPage = lazyNamed(() => import('./pages/admin/AdminLiveClassesPage'), 'AdminLiveClassesPage');
const AdminAnnouncementsPage = lazyNamed(() => import('./pages/admin/AdminAnnouncementsPage'), 'AdminAnnouncementsPage');
const AdminLeaveRequestsPage = lazyNamed(() => import('./pages/admin/AdminLeaveRequestsPage'), 'AdminLeaveRequestsPage');
const AdminAuditLogsPage = lazyNamed(() => import('./pages/admin/AdminAuditLogsPage'), 'AdminAuditLogsPage');
const AdminReportsPage = lazyNamed(() => import('./pages/admin/AdminReportsPage'), 'AdminReportsPage');
const AdminCoursesPage = lazyNamed(() => import('./pages/admin/AdminCoursesPage'), 'AdminCoursesPage');
const AdminLessonsPage = lazyNamed(() => import('./pages/admin/AdminLessonsPage'), 'AdminLessonsPage');
const AdminQuizzesPage = lazyNamed(() => import('./pages/admin/AdminQuizzesPage'), 'AdminQuizzesPage');
const AdminUsersPage = lazyNamed(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage');
const AdminBatchesPage = lazyNamed(() => import('./pages/admin/AdminBatchesPage'), 'AdminBatchesPage');

// Mock Test Pages (Lazy-loaded chunks)
const MockTestDashboard = lazyNamed(() => import('./pages/mockTests/MockTestDashboard'), 'MockTestDashboard');
const MockTestPreCheckPage = lazyNamed(() => import('./pages/mockTests/MockTestPreCheckPage'), 'MockTestPreCheckPage');
const MockTestRunnerPage = lazyNamed(() => import('./pages/mockTests/MockTestRunnerPage'), 'MockTestRunnerPage');
const MockTestResultPage = lazyNamed(() => import('./pages/mockTests/MockTestResultPage'), 'MockTestResultPage');
const TeacherMockTestsPage = lazyNamed(() => import('./pages/teacher/TeacherMockTestsPage'), 'TeacherMockTestsPage');
const TeacherTestBuilderPage = lazyNamed(() => import('./pages/teacher/TeacherTestBuilderPage'), 'TeacherTestBuilderPage');
const TeacherProctoringReviewPage = lazyNamed(() => import('./pages/teacher/TeacherProctoringReviewPage'), 'TeacherProctoringReviewPage');
const TeacherTestAnalyticsPage = lazyNamed(() => import('./pages/teacher/TeacherTestAnalyticsPage'), 'TeacherTestAnalyticsPage');
const AdminMockTestsPage = lazyNamed(() => import('./pages/admin/AdminMockTestsPage'), 'AdminMockTestsPage');
const QuestionBankPage = lazyNamed(() => import('./pages/questions/QuestionBankPage'), 'QuestionBankPage');

function AppContent() {
  const location = useLocation();
  const isRunner = location.pathname.includes('/runner/');

  // Comprehensive scroll-to-top on route change across all public, student, teacher, and admin pages
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const scrollContainers = document.querySelectorAll('.teacher-main-content, .admin-main-content, main');
    scrollContainers.forEach(el => {
      if (el && typeof el.scrollTo === 'function') {
        el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    });
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isRunner && <Navbar />}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />

                {/* AI Tutor */}
                <Route path="/ai-tutor" element={<AITutorPage />} />

                {/* Student Protected Routes (Strictly Isolated to STUDENT role) */}
                <Route path="/dashboard" element={<ProtectedRoute requiredRole="STUDENT"><StudentDashboard /></ProtectedRoute>} />
                <Route path="/student/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/student" element={<Navigate to="/dashboard" replace />} />
                <Route path="/student/results" element={<Navigate to="/mock-tests" replace />} />
                <Route path="/timetable" element={<ProtectedRoute requiredRole="STUDENT"><StudentTimetablePage /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute requiredRole="STUDENT"><StudentAttendancePage /></ProtectedRoute>} />
                <Route path="/assignments" element={<ProtectedRoute requiredRole="STUDENT"><StudentAssignmentsPage /></ProtectedRoute>} />
                <Route path="/materials" element={<ProtectedRoute requiredRole="STUDENT"><StudentMaterialsPage /></ProtectedRoute>} />
                <Route path="/live-classes" element={<ProtectedRoute requiredRole="STUDENT"><StudentLiveClassesPage /></ProtectedRoute>} />
                <Route path="/announcements" element={<ProtectedRoute requiredRole="STUDENT"><StudentAnnouncementsPage /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute requiredRole="STUDENT"><StudentSupportTicketsPage /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute requiredRole="STUDENT"><StudentProgressPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/coding" element={<ProtectedRoute requiredRole="STUDENT"><CodingChallengePage /></ProtectedRoute>} />
                <Route path="/coding/:id" element={<ProtectedRoute requiredRole="STUDENT"><CodingChallengePage /></ProtectedRoute>} />
                <Route path="/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute requiredRole="STUDENT"><LessonViewerPage /></ProtectedRoute>} />
                <Route path="/quiz/:quizId" element={<ProtectedRoute requiredRole="STUDENT"><QuizTakePage /></ProtectedRoute>} />
                <Route path="/quiz/results/:attemptId" element={<ProtectedRoute requiredRole="STUDENT"><QuizResultPage /></ProtectedRoute>} />

                {/* Mock Tests (Student & Public Catalog) */}
                <Route path="/mock-tests" element={<MockTestDashboard />} />
                <Route path="/mock-tests/:id/check" element={<ProtectedRoute requiredRole="STUDENT"><MockTestPreCheckPage /></ProtectedRoute>} />
                <Route path="/mock-tests/:id/runner/:attemptId" element={<ProtectedRoute requiredRole="STUDENT"><MockTestRunnerPage /></ProtectedRoute>} />
                <Route path="/mock-tests/attempts/:attemptId/result" element={<ProtectedRoute><MockTestResultPage /></ProtectedRoute>} />

                {/* Teacher Protected Routes with TeacherLayout */}
                <Route path="/teacher/dashboard" element={<Navigate to="/teacher" replace />} />
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherDashboard /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/classes"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherClassesPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/timetable"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherTimetablePage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/attendance"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherAttendancePage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/assignments"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherAssignmentsPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/materials"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherMaterialsPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/live-classes"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherLiveClassesPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/announcements"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherAnnouncementsPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/leave"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherLeavePage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/syllabus"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherSyllabusPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/profile"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherProfilePage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/mock-tests"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherMockTestsPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/mock-tests/create"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherTestBuilderPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/mock-tests/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherTestBuilderPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/mock-tests/:id/analytics"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherTestAnalyticsPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/mock-tests/:id/attempts/:attemptId/review"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><TeacherProctoringReviewPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/question-bank"
                  element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <TeacherLayout><QuestionBankPage /></TeacherLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes with AdminLayout */}
                <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminDashboard /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/students"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminStudentsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/teachers"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminTeachersPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/classes"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminClassesPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/batches"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminBatchesPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/subjects"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminSubjectsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/timetable"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminTimetablePage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/attendance"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminAttendancePage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/live-classes"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminLiveClassesPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/announcements"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminAnnouncementsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/leave-requests"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminLeaveRequestsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminAuditLogsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminReportsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/courses"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminCoursesPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/lessons"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminLessonsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/quizzes"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminQuizzesPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminUsersPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/mock-tests"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><AdminMockTestsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/mock-tests/:id/analytics"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><TeacherTestAnalyticsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/mock-tests/:id/analysis"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><TeacherTestAnalyticsPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/question-bank"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminLayout><QuestionBankPage /></AdminLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          {!isRunner && <Footer />}
          </div>
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
