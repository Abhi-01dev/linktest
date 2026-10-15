const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('linktest_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('linktest_token', token);
    } else {
      localStorage.removeItem('linktest_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.error?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.code = data?.error?.code || 'UNKNOWN_ERROR';
        error.details = data?.error?.details || [];
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error('Cannot connect to LinkTest server. Please verify backend is running on port 8081.');
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
      }
      throw err;
    }
  }

  // Auth Endpoints
  async register(fullName, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password })
    });
    // Note: unverified accounts do not receive a session token until email is verified
    return res.data;
  }

  async verifyEmail(email, otp) {
    const res = await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async resendVerification(email) {
    const res = await this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return res.data;
  }

  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async getMe() {
    if (!this.token) return null;
    const res = await this.request('/auth/me');
    return res.data.user;
  }

  async loginWithGoogle(credential) {
    const res = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async unlinkGoogle(password = '') {
    const res = await this.request('/auth/google/unlink', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    return res.data;
  }

  logout() {
    this.setToken(null);
  }

  // Courses
  async getCourses(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'All') searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.published) searchParams.set('published', params.published);

    const qs = searchParams.toString();
    const endpoint = `/courses${qs ? `?${qs}` : ''}`;
    const res = await this.request(endpoint);
    return res.data.courses;
  }

  async getCourseById(id) {
    const res = await this.request(`/courses/${id}`);
    return res.data;
  }

  async enrollCourse(id) {
    const res = await this.request(`/courses/${id}/enroll`, { method: 'POST' });
    return res.data;
  }

  async getMyCourses() {
    const res = await this.request('/courses/enrolled/me');
    return res.data.courses;
  }

  // Lessons & Progress
  async getLessons(courseId) {
    const res = await this.request(`/lessons/course/${courseId}`);
    return res.data.lessons;
  }

  async getLessonById(id) {
    const res = await this.request(`/lessons/${id}`);
    return res.data.lesson;
  }

  async setProgress(lessonId, completed) {
    const res = await this.request('/progress', {
      method: 'POST',
      body: JSON.stringify({ lesson_id: lessonId, completed })
    });
    return res.data;
  }

  // Quizzes & Assessments
  async getQuizzesByCourse(courseId) {
    const res = await this.request(`/quizzes/course/${courseId}`);
    return res.data.quizzes;
  }

  async getQuizById(id) {
    const res = await this.request(`/quizzes/${id}`);
    return res.data.quiz;
  }

  async submitQuizAttempt(quizId, answers) {
    const res = await this.request(`/quizzes/${quizId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
    return res.data;
  }

  async getMyAttempts() {
    const res = await this.request('/quizzes/attempts/me');
    return res.data.attempts;
  }

  async getAttemptDetails(attemptId) {
    const res = await this.request(`/quizzes/attempts/${attemptId}`);
    return res.data.attempt;
  }

  // AI Tutor
  async getAiStatus() {
    const res = await this.request('/ai/status');
    return res.data;
  }

  async initOllama(options = {}) {
    const res = await this.request('/ai/init', {
      method: 'POST',
      body: JSON.stringify(options)
    });
    return res.data;
  }

  async chatWithAi(message, conversationId) {
    const res = await this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId })
    });
    const data = res.data || {};
    const text = data.reply || data.response || '';
    return { ...data, reply: text, response: text };
  }

  async generateQuiz(topic, count = 5) {
    const res = await this.request('/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify({ topic, count })
    });
    return res.data;
  }

  // Admin APIs
  async getAdminDashboard() {
    const res = await this.request('/admin/dashboard');
    return res.data?.stats || res.data || {};
  }

  async getAdminUsers() {
    const res = await this.request('/admin/users');
    return res.data.users;
  }

  async createCourse(courseData) {
    const res = await this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
    return res.data?.course || res.data;
  }

  async updateCourse(id, courseData) {
    const res = await this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
    return res.data?.course || res.data;
  }

  async deleteCourse(id) {
    const res = await this.request(`/courses/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  async createLesson(courseId, lessonData) {
    const res = await this.request(`/lessons/course/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(lessonData)
    });
    return res.data?.lesson || res.data;
  }

  async updateLesson(id, lessonData) {
    const res = await this.request(`/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lessonData)
    });
    return res.data?.lesson || res.data;
  }

  async deleteLesson(id) {
    const res = await this.request(`/lessons/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  async createQuiz(quizData) {
    const res = await this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData)
    });
    return res.data?.quiz || res.data;
  }

  // ── Auth Extended Endpoints ──────────────────────────────────────────
  async acceptTeacherInvite(token, password) {
    const res = await this.request('/auth/teacher-accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
    if (res.data?.token) this.setToken(res.data.token);
    return res.data;
  }

  async forgotPassword(email) {
    const res = await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return res.data;
  }

  async resetPassword(token, newPassword) {
    const res = await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword })
    });
    return res.data;
  }

  async changePassword(currentPassword, newPassword) {
    const res = await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    return res.data;
  }

  // ── Admin Portal APIs ────────────────────────────────────────────────
  async getAdminStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/admin/students${query ? `?${query}` : ''}`);
    return res.data?.students || (Array.isArray(res.data) ? res.data : []);
  }

  async createAdminStudent(data) {
    const res = await this.request('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.student || res.data;
  }

  async updateUserStatus(userId, status) {
    const res = await this.request(`/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    return res.data?.user || res.data;
  }

  async updateAdminUser(userId, data) {
    const res = await this.request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data?.user || res.data;
  }

  async getAdminTeachers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/admin/teachers${query ? `?${query}` : ''}`);
    return res.data?.teachers || (Array.isArray(res.data) ? res.data : []);
  }

  async inviteTeacher(email, fullName) {
    const res = await this.request('/admin/teachers/invite', {
      method: 'POST',
      body: JSON.stringify({ email, full_name: fullName })
    });
    return res.data;
  }

  async getAdminClasses() {
    const res = await this.request('/admin/classes');
    return res.data?.classes || (Array.isArray(res.data) ? res.data : []);
  }

  async createAdminClass(data) {
    const res = await this.request('/admin/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.class || res.data;
  }

  async getAdminBatches(classId) {
    const endpoint = classId ? `/admin/classes/${classId}/batches` : '/batches';
    const res = await this.request(endpoint);
    return res.data?.batches || (Array.isArray(res.data) ? res.data : []);
  }

  async createAdminBatch(data) {
    const endpoint = data.class_id ? `/admin/classes/${data.class_id}/batches` : '/batches';
    const res = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.batch || res.data;
  }

  async getAdminSubjects() {
    const res = await this.request('/subjects');
    return res.data?.subjects || (Array.isArray(res.data) ? res.data : []);
  }

  async createAdminSubject(data) {
    const res = await this.request('/admin/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.subject || res.data;
  }

  async assignTeacher(data) {
    const teacherId = data.teacher_id;
    const res = await this.request(teacherId ? `/admin/teachers/${teacherId}/assign` : '/admin/teachers/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.assignment || res.data;
  }

  async enrollStudent(data) {
    const res = await this.request('/admin/students/enroll', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.enrollment || res.data;
  }

  async getAdminTimetable(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/admin/timetable${query ? `?${query}` : ''}`);
    return res.data?.entries || (Array.isArray(res.data) ? res.data : []);
  }

  async createAdminTimetableEntry(data) {
    const res = await this.request('/admin/timetable', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.entry || res.data;
  }

  async deleteAdminTimetableEntry(id) {
    const res = await this.request(`/admin/timetable/${id}`, { method: 'DELETE' });
    return res.data;
  }

  async getAdminAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/admin/attendance${query ? `?${query}` : ''}`);
    return res.data?.records || (Array.isArray(res.data) ? res.data : []);
  }

  async getAdminAssignments() {
    const res = await this.request('/admin/assignments');
    return res.data?.assignments || (Array.isArray(res.data) ? res.data : []);
  }

  async getAdminAnnouncements() {
    const res = await this.request('/admin/announcements');
    return res.data?.announcements || (Array.isArray(res.data) ? res.data : []);
  }

  async createAdminAnnouncement(data) {
    const res = await this.request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.announcement || res.data;
  }

  async getAdminLiveClasses() {
    const res = await this.request('/admin/live-classes');
    return res.data?.sessions || (Array.isArray(res.data) ? res.data : []);
  }

  async createAdminLiveClass(data) {
    const res = await this.request('/admin/live-classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.session || res.data;
  }

  async getAdminLeaveRequests() {
    const res = await this.request('/admin/leave-requests');
    return res.data?.requests || (Array.isArray(res.data) ? res.data : []);
  }

  async reviewAdminLeaveRequest(id, data) {
    const res = await this.request(`/admin/leave-requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.request || res.data;
  }

  async getAdminAuditLogs(params = {}) {
    const cleanParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') cleanParams[k] = v;
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await this.request(`/admin/audit-logs${query ? `?${query}` : ''}`);
    return res.data;
  }

  async getAdminSecurityLogs(params = {}) {
    const cleanParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') cleanParams[k] = v;
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await this.request(`/admin/security-logs${query ? `?${query}` : ''}`);
    return res.data;
  }

  async getAdminReports(params = {}) {
    const cleanParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') cleanParams[k] = v;
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await this.request(`/admin/reports/overview${query ? `?${query}` : ''}`);
    return res.data?.report || res.data || {};
  }

  async exportAdminReportsCSV(params = {}) {
    const cleanParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') cleanParams[k] = v;
    }
    const query = new URLSearchParams(cleanParams).toString();
    const url = `${BASE_URL}/admin/reports/export${query ? `?${query}` : ''}`;
    const headers = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to export report CSV: ${response.statusText}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `linktest-academic-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  }

  // ── Dedicated Batch Management & Teacher Allocation APIs ───────────────
  async getBatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/batches${query ? `?${query}` : ''}`);
    return res.data?.batches || (Array.isArray(res.data) ? res.data : []);
  }

  async getBatchById(batchId) {
    const res = await this.request(`/batches/${batchId}`);
    return res.data?.batch || res.data;
  }

  async createBatch(data) {
    const res = await this.request('/batches', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.batch || res.data;
  }

  async updateBatch(batchId, data) {
    const res = await this.request(`/batches/${batchId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data?.batch || res.data;
  }

  async archiveBatch(batchId) {
    const res = await this.request(`/batches/${batchId}/archive`, {
      method: 'POST'
    });
    return res.data?.batch || res.data;
  }

  async deleteBatch(batchId) {
    return this.request(`/batches/${batchId}`, {
      method: 'DELETE'
    });
  }

  async getBatchTeachers(batchId) {
    const res = await this.request(`/batches/${batchId}/teachers`);
    return res.data?.teachers || (Array.isArray(res.data) ? res.data : []);
  }

  async assignTeacherToBatch(batchId, teacherId) {
    const res = await this.request(`/batches/${batchId}/teachers`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId })
    });
    return res.data?.allocation || res.data;
  }

  async removeTeacherFromBatch(batchId, teacherId) {
    return this.request(`/batches/${batchId}/teachers/${teacherId}`, {
      method: 'DELETE'
    });
  }

  async getBatchStudents(batchId) {
    const res = await this.request(`/batches/${batchId}/students`);
    return res.data?.students || (Array.isArray(res.data) ? res.data : []);
  }

  async enrollStudentsInBatch(batchId, studentIds) {
    const payload = Array.isArray(studentIds) ? { student_ids: studentIds } : { student_id: studentIds };
    const res = await this.request(`/batches/${batchId}/students`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  async removeStudentFromBatch(batchId, studentId) {
    return this.request(`/batches/${batchId}/students/${studentId}`, {
      method: 'DELETE'
    });
  }

  // ── Database Student Search ──────────────────────────────────────────
  async searchStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/students/search${query ? `?${query}` : ''}`);
    return res.data || { students: [], total: 0 };
  }

  // ── Teacher Portal APIs ──────────────────────────────────────────────
  async getTeacherDashboard() {
    const res = await this.request('/teacher/dashboard');
    return res.data;
  }

  async getTeacherClasses() {
    const res = await this.request('/teacher/classes');
    return res.data;
  }

  async getTeacherStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/teacher/students${query ? `?${query}` : ''}`);
    return res.data;
  }

  async getTeacherTimetable(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/teacher/timetable${query ? `?${query}` : ''}`);
    return res.data;
  }

  async getTeacherAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/teacher/attendance${query ? `?${query}` : ''}`);
    return res.data;
  }

  async markTeacherAttendance(records) {
    const res = await this.request('/teacher/attendance', {
      method: 'POST',
      body: JSON.stringify({ records })
    });
    return res.data;
  }

  async getTeacherAssignments() {
    const res = await this.request('/teacher/assignments');
    return res.data;
  }

  async createTeacherAssignment(data) {
    const res = await this.request('/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTeacherSubmissions(assignmentId) {
    const res = await this.request(`/teacher/assignments/${assignmentId}/submissions`);
    return res.data;
  }

  async gradeTeacherSubmission(submissionId, data) {
    const res = await this.request(`/teacher/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTeacherMaterials(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/teacher/materials${query ? `?${query}` : ''}`);
    return res.data;
  }

  async createTeacherMaterial(data) {
    const res = await this.request('/teacher/materials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTeacherLiveClasses(status) {
    const query = status ? `?status=${status}` : '';
    const res = await this.request(`/teacher/live-classes${query}`);
    return res.data;
  }

  async createTeacherLiveClass(data) {
    const res = await this.request('/teacher/live-classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateTeacherLiveClassStatus(id, status) {
    const res = await this.request(`/teacher/live-classes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return res.data;
  }

  async endTeacherLiveClass(id) {
    const res = await this.request(`/teacher/live-classes/${id}/end`, {
      method: 'POST'
    });
    return res.data;
  }

  // ── LiveKit WebRTC Video Platform APIs ────────────────────────────────
  async getLiveKitStatus() {
    const res = await this.request('/livekit/status');
    return res.data;
  }

  async getLiveKitToken(payload = {}) {
    const res = await this.request('/livekit/token', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  }

  async endLiveKitSession(sessionId) {
    const res = await this.request(`/livekit/sessions/${sessionId}/end`, {
      method: 'POST'
    });
    return res.data;
  }

  async getTeacherAnnouncements() {
    const res = await this.request('/teacher/announcements');
    return res.data;
  }

  async createTeacherAnnouncement(data) {
    const res = await this.request('/teacher/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTeacherLeaveRequests() {
    const res = await this.request('/teacher/leave-requests');
    return res.data;
  }

  async applyTeacherLeave(data) {
    const res = await this.request('/teacher/leave-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTeacherSyllabus(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/teacher/syllabus${query ? `?${query}` : ''}`);
    return res.data;
  }

  async updateTeacherSyllabusTopic(id, data) {
    const res = await this.request(`/teacher/syllabus/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTeacherProfile() {
    const res = await this.request('/teacher/profile');
    return res.data;
  }

  async updateTeacherProfile(data) {
    const res = await this.request('/teacher/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  // ── Student Portal APIs ──────────────────────────────────────────────
  async getStudentDashboard() {
    const res = await this.request('/student/dashboard');
    return res.data;
  }

  async getStudentClasses() {
    const res = await this.request('/student/classes');
    return res.data;
  }

  async getStudentTimetable(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/student/timetable${query ? `?${query}` : ''}`);
    return res.data;
  }

  async getStudentAttendance() {
    const res = await this.request('/student/attendance');
    return res.data;
  }

  async getStudentAssignments() {
    const res = await this.request('/student/assignments');
    return res.data;
  }

  async submitStudentAssignment(id, data) {
    const res = await this.request(`/student/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getStudentMaterials() {
    const res = await this.request('/student/materials');
    return res.data;
  }

  async getStudentLiveClasses() {
    const res = await this.request('/student/live-classes');
    return res.data;
  }

  async getStudentAnnouncements() {
    const res = await this.request('/student/announcements');
    return res.data;
  }

  async getStudentNotifications(unreadOnly = false) {
    const res = await this.request(`/student/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
    return res.data;
  }

  async markNotificationsRead(ids) {
    const res = await this.request('/student/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
    return res.data;
  }

  async getStudentTickets() {
    const res = await this.request('/student/tickets');
    return res.data;
  }

  async createStudentTicket(data) {
    const res = await this.request('/student/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  // ============================================================================
  // SECURE MOCK TESTS & AI EXAMINATION SYSTEM APIS
  // ============================================================================

  async getMockTests(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.subject && params.subject !== 'all') searchParams.set('subject', params.subject);
    if (params.difficulty && params.difficulty !== 'all') searchParams.set('difficulty', params.difficulty);
    if (params.search) searchParams.set('search', params.search);
    if (params.scope) searchParams.set('scope', params.scope);
    if (params.status) searchParams.set('status', params.status);

    const qs = searchParams.toString();
    const endpoint = `/mock-tests${qs ? `?${qs}` : ''}`;
    const res = await this.request(endpoint);
    return res.data.tests;
  }

  async getMockTestById(id) {
    const res = await this.request(`/mock-tests/${id}`);
    return res.data.test;
  }

  async createMockTest(data) {
    const res = await this.request('/mock-tests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data.test;
  }

  async updateMockTest(id, data) {
    const res = await this.request(`/mock-tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data.test;
  }

  async deleteMockTest(id) {
    const res = await this.request(`/mock-tests/${id}`, {
      method: 'DELETE'
    });
    return res;
  }

  async duplicateMockTest(id) {
    const res = await this.request(`/mock-tests/${id}/duplicate`, {
      method: 'POST'
    });
    return res.data.test;
  }

  async publishMockTest(id, status = 'published') {
    const res = await this.request(`/mock-tests/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    return res.data.test;
  }

  async releaseMockTestResults(id, results_published = true) {
    const res = await this.request(`/mock-tests/${id}/release-results`, {
      method: 'POST',
      body: JSON.stringify({ results_published })
    });
    return res.data.test;
  }

  async getMockTestAttempts(id) {
    const res = await this.request(`/mock-tests/${id}/attempts`);
    return res.data.attempts;
  }

  async getMockTestAnalytics(id) {
    const res = await this.request(`/mock-tests/${id}/analytics`);
    return res.data;
  }

  async generateAiMockTestQuestions(data) {
    const res = await this.request('/mock-tests/generate-questions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async startMockTestAttempt(id) {
    if (!id || id === 'undefined' || id === 'null' || !String(id).trim()) {
      throw new Error('Valid mock test ID is required to start an attempt.');
    }
    const res = await this.request(`/mock-tests/${id}/attempts`, {
      method: 'POST'
    });
    return res.data;
  }

  async getMockTestAttempt(attemptId) {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
      throw new Error('Valid attempt ID is required to load examination.');
    }
    const res = await this.request(`/mock-tests/attempts/${attemptId}`);
    return res.data;
  }

  async saveMockTestAnswer(attemptId, answerData) {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
      throw new Error('Valid attempt ID is required to save answers.');
    }
    const res = await this.request(`/mock-tests/attempts/${attemptId}/answers`, {
      method: 'PUT',
      body: JSON.stringify(answerData)
    });
    return res.data;
  }

  async logMockTestProctoringEvent(attemptId, eventData) {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
      throw new Error('Valid attempt ID is required to log proctoring event.');
    }
    const res = await this.request(`/mock-tests/attempts/${attemptId}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    return res.data;
  }

  async submitMockTestAttempt(attemptId, options = {}) {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
      throw new Error('Valid attempt ID is required to submit examination.');
    }
    const res = await this.request(`/mock-tests/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
    return res.data;
  }

  async getMockTestAttemptResult(attemptId) {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
      throw new Error('Valid attempt ID is required to load examination result.');
    }
    const res = await this.request(`/mock-tests/attempts/${attemptId}/result`);
    return res.data;
  }

  async getMyMockTestAttempts(testId = null) {
    const res = await this.request(`/mock-tests/my-attempts${testId ? `?test_id=${testId}` : ''}`);
    return res.data.attempts;
  }

  async getMockTestProctoringEvents(attemptId) {
    const res = await this.request(`/mock-tests/attempts/${attemptId}/proctoring-events`);
    return res.data.events;
  }

  async reviewMockTestProctoringEvent(eventId, reviewData) {
    const res = await this.request(`/mock-tests/events/${eventId}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
    return res.data;
  }

  // ==========================================
  // MOCK TEST JOIN REQUESTS & APPROVALS
  // ==========================================
  async requestMockTestJoin(testId) {
    if (!testId || testId === 'undefined' || testId === 'null' || !String(testId).trim()) {
      throw new Error('Valid mock test ID is required to request join approval.');
    }
    const res = await this.request(`/mock-tests/${testId}/join-request`, {
      method: 'POST'
    });
    return res.data;
  }

  async getMockTestJoinStatus(testId) {
    if (!testId || testId === 'undefined' || testId === 'null' || !String(testId).trim()) {
      throw new Error('Valid mock test ID is required to check join status.');
    }
    const res = await this.request(`/mock-tests/${testId}/join-request`);
    return res.data;
  }

  async getTeacherMockTestJoinRequests(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.mock_test_id) searchParams.set('mock_test_id', params.mock_test_id);
    const qs = searchParams.toString();
    const endpoint = `/teacher/mock-tests/join-requests${qs ? `?${qs}` : ''}`;
    const res = await this.request(endpoint);
    return res.data;
  }

  async getMockTestJoinRequests(testId, params = {}) {
    if (!testId || testId === 'undefined' || testId === 'null' || !String(testId).trim()) {
      throw new Error('Valid mock test ID is required to retrieve join requests.');
    }
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    const qs = searchParams.toString();
    const endpoint = `/teacher/mock-tests/${testId}/join-requests${qs ? `?${qs}` : ''}`;
    const res = await this.request(endpoint);
    return res.data;
  }

  async approveMockTestJoinRequest(requestId) {
    if (!requestId || requestId === 'undefined' || requestId === 'null' || !String(requestId).trim()) {
      throw new Error('Valid request ID is required to approve join request.');
    }
    const res = await this.request(`/teacher/mock-tests/join-requests/${requestId}/approve`, {
      method: 'POST'
    });
    return res.data;
  }

  async rejectMockTestJoinRequest(requestId, reason = '') {
    if (!requestId || requestId === 'undefined' || requestId === 'null' || !String(requestId).trim()) {
      throw new Error('Valid request ID is required to reject join request.');
    }
    const res = await this.request(`/teacher/mock-tests/join-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return res.data;
  }

  // ==========================================
  // QUESTION BANK & BULK CSV IMPORT
  // ==========================================
  async downloadQuestionBankTemplate() {
    const url = `${BASE_URL}/questions/csv/template`;
    const res = await fetch(url, {
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to download CSV template (${res.status})`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'linktest_question_bank_template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  }

  async previewQuestionCsv(fileOrContent) {
    if (fileOrContent instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrContent);
      const url = `${BASE_URL}/questions/csv/preview`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: formData
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error?.message || `CSV Preview failed (${response.status})`);
      }
      return data.data;
    } else {
      const res = await this.request('/questions/csv/preview', {
        method: 'POST',
        body: JSON.stringify({ csvContent: fileOrContent })
      });
      return res.data;
    }
  }

  async importQuestionCsv({ file, csvContent, duplicateStrategy = 'skip' }) {
    if (file instanceof File) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('duplicateStrategy', duplicateStrategy);
      const url = `${BASE_URL}/questions/csv/import`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: formData
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error?.message || `CSV Import failed (${response.status})`);
      }
      return data;
    } else {
      const res = await this.request('/questions/csv/import', {
        method: 'POST',
        body: JSON.stringify({ csvContent, duplicateStrategy })
      });
      return res;
    }
  }

  async downloadQuestionImportErrorReport(failedRows) {
    const url = `${BASE_URL}/questions/csv/error-report`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify({ failedRows })
    });
    if (!res.ok) {
      throw new Error(`Failed to download error report (${res.status})`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'import_error_details.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  }

  async getQuestionBank(params = {}) {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.subject && params.subject !== 'all') q.append('subject', params.subject);
    if (params.topic && params.topic !== 'all') q.append('topic', params.topic);
    if (params.difficulty && params.difficulty !== 'all') q.append('difficulty', params.difficulty);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);

    const queryString = q.toString() ? `?${q.toString()}` : '';
    const res = await this.request(`/questions/bank${queryString}`);
    return res;
  }

  async getQuestionBankFilters() {
    const res = await this.request('/questions/bank/filters');
    return res.data;
  }

  async createQuestionBankItem(data) {
    const res = await this.request('/questions/bank', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async deleteQuestionBankItem(id) {
    const res = await this.request(`/questions/bank/${id}`, {
      method: 'DELETE'
    });
    return res;
  }
}

export const api = new ApiClient();
