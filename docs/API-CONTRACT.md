# LinkTest — REST API Specification & Contract

## 1. Global Standard Response Format

All responses follow a predictable JSON envelope.

### Success Response (HTTP 200, 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Human readable confirmation message"
}
```

### Error Response (HTTP 400, 401, 403, 404, 429, 500)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_CONSTANT",
    "message": "Human readable explanation of the error",
    "details": [] 
  }
}
```

Standard Error Codes:
- `VALIDATION_ERROR` (400) — Input payload failed Zod schema validation
- `UNAUTHORIZED` (401) — Missing, malformed, or expired JWT token
- `EMAIL_NOT_VERIFIED` (403) — User email not verified; access denied
- `INVALID_OTP` (400) — Incorrect 6-digit OTP code supplied
- `OTP_EXPIRED` (400) — OTP has expired (5-minute TTL)
- `RESEND_COOLDOWN` (429) — Resend requested before 60-second cooldown elapsed
- `MAX_ATTEMPTS_EXCEEDED` (429) — Exceeded 5 failed verification attempts
- `EMAIL_DELIVERY_FAILED` (502) — SMTP server failed to deliver verification email
- `FORBIDDEN` (403) — User role (`STUDENT`) lacks permission to access resource (`ADMIN` required)
- `NOT_FOUND` (404) — Entity does not exist
- `CONFLICT` (409) — Unique constraint violation (e.g. email already exists and verified)
- `RATE_LIMIT_EXCEEDED` (429) — Too many requests within window
- `AI_UNAVAILABLE` (503) — Local Ollama service unreachable or model not loaded
- `INTERNAL_SERVER_ERROR` (500) — Unexpected server exception

---

## 2. Authentication Headers
All protected routes require the `Authorization` header:
```http
Authorization: Bearer <jwt_token>
```

---

## 3. Endpoints Specification

### 3.1 Authentication & Email Verification
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register student in unverified state & send 6-digit OTP |
| `POST` | `/api/auth/verify-email` | Public | Validate OTP, mark email verified & return JWT session |
| `POST` | `/api/auth/resend-verification` | Public | Invalidate prior OTP & send new 6-digit OTP (60s cooldown) |
| `POST` | `/api/auth/login` | Public | Login (rejects unverified accounts with `403 EMAIL_NOT_VERIFIED`) |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile and verification status |

#### `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "full_name": "Aarav Sharma",
    "email": "aarav@example.com",
    "password": "Password123!"
  }
  ```
- **Response `data`**:
  ```json
  {
    "user": {
      "id": "uuid",
      "full_name": "Aarav Sharma",
      "email": "aarav@example.com",
      "role": "STUDENT",
      "email_verified": false,
      "created_at": "2026-10-11T12:00:00Z"
    },
    "email_sent": true
  }
  ```

#### `POST /api/auth/verify-email`
- **Request Body**:
  ```json
  {
    "email": "aarav@example.com",
    "otp": "492817"
  }
  ```
- **Response `data`**:
  ```json
  {
    "user": {
      "id": "uuid",
      "full_name": "Aarav Sharma",
      "email": "aarav@example.com",
      "role": "STUDENT",
      "email_verified": true,
      "email_verified_at": "2026-10-11T12:01:00Z",
      "created_at": "2026-10-11T12:00:00Z"
    },
    "token": "eyJhbGciOi..."
  }
  ```

#### `POST /api/auth/resend-verification`
- **Request Body**:
  ```json
  {
    "email": "aarav@example.com"
  }
  ```
- **Response `data`**:
  ```json
  {
    "message": "If an unverified account exists, a new verification code has been dispatched."
  }
  ```

#### `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "aarav@example.com",
    "password": "Password123!"
  }
  ```
- **Response `data`**: Same as `verify-email` with JWT token.

### 3.2 Admin Student Lifecycle
All endpoints in this section require an authenticated administrator.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/students` | Admin | Create a verified student account with an enrollment ID and password |
| `PUT` | `/api/admin/students/:id/status` | Admin | Set a student account to `Active` or `Suspended` |
| `POST` | `/api/admin/students/:id/reset-password` | Admin | Email the student a one-hour secure password-reset link |

#### `POST /api/admin/students`
- **Request Body** (`password` and `enrollment_id` are optional; secure values are generated when omitted):
  ```json
  {
    "full_name": "Aarav Sharma",
    "email": "aarav@example.com",
    "password": "Password123!",
    "enrollment_id": "LT-20261011-1234ABCD"
  }
  ```
- **Response `data`** includes the student, the enrollment ID, and a generated `temporary_password` only when the request omitted a password. The generated password is returned once to the authenticated administrator and is not stored or audited in plaintext.
- Duplicate email addresses return `409 EMAIL_ALREADY_EXISTS`.

#### `PUT /api/admin/students/:id/status`
- **Request Body**:
  ```json
  { "status": "Suspended" }
  ```
- Accepts `Active` or `Suspended` (case-insensitive). Suspended students are denied login with `403 ACCOUNT_SUSPENDED`.
- Each successful lifecycle action is recorded in the audit log with the acting administrator, target student, and timestamp.

#### `POST /api/admin/students/:id/reset-password`
- Sends the existing expiring, single-use password-reset link to the student's verified email address. The reset token is never returned by this endpoint.

---

### 3.3 Courses & Lessons
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | Public | Browse courses (optional `?search=`, `?category=`, `?published=`) |
| `GET` | `/api/courses/:id` | Public | Get single course details with lesson outline |
| `GET` | `/api/courses/:id/lessons` | Authenticated | Get lessons for a course including user progress |
| `POST` | `/api/courses/:id/enroll` | Authenticated | Enroll current student in a course |
| `POST` | `/api/progress` | Authenticated | Mark lesson complete or uncomplete |

#### `POST /api/progress`
- **Request Body**:
  ```json
  {
    "lesson_id": "uuid",
    "completed": true
  }
  ```
- **Response `data`**:
  ```json
  {
    "lesson_id": "uuid",
    "completed": true,
    "course_id": "uuid",
    "course_progress_percentage": 66.7
  }
  ```

---

### 3.4 Quizzes & Assessments
> [!IMPORTANT]
> To preserve assessment integrity, `GET /api/quizzes/:courseId` **MUST NEVER** return `correct_option_index` or explanations before submission. Answers are computed and verified strictly on the server.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/quizzes/course/:courseId` | Authenticated | Get quiz and questions for a course (without answers) |
| `GET` | `/api/quizzes/:id` | Authenticated | Get quiz by ID (without answers) |
| `POST` | `/api/quizzes/:id/attempts` | Authenticated | Submit answers for server scoring and persistence |
| `GET` | `/api/quizzes/attempts/me` | Authenticated | Get current student's quiz attempt history |
| `GET` | `/api/quizzes/attempts/:attemptId` | Authenticated | Get details of a past attempt with explanations |

#### `POST /api/quizzes/:id/attempts`
- **Request Body**:
  ```json
  {
    "answers": [
      { "question_id": "uuid-1", "selected_option_index": 2 },
      { "question_id": "uuid-2", "selected_option_index": 0 }
    ]
  }
  ```
- **Response `data`**:
  ```json
  {
    "attempt_id": "uuid-attempt",
    "score": 4,
    "total_questions": 5,
    "percentage": 80.0,
    "passed": true,
    "submitted_at": "2026-10-11T12:05:00Z",
    "results": [
      {
        "question_id": "uuid-1",
        "question_text": "What is the Big-O time complexity of binary search?",
        "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        "selected_option_index": 1,
        "correct_option_index": 1,
        "is_correct": true,
        "explanation": "Binary search divides the search space in half at each step, yielding logarithmic time O(log n)."
      }
    ]
  }
  ```

---

### 3.5 AI Tutor & Testing
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ai/status` | Public | Check Ollama availability and loaded model |
| `POST` | `/api/ai/chat` | Authenticated | Send message to AI Tutor, receive educational explanation |
| `POST` | `/api/ai/generate-quiz` | Authenticated | Generate practice MCQs on a specified topic |

#### `POST /api/ai/chat`
- **Request Body**:
  ```json
  {
    "message": "Can you explain recursion using an analogy a beginner would easily understand?",
    "conversation_id": "uuid-optional"
  }
  ```
- **Response `data`**:
  ```json
  {
    "reply": "Think of recursion like a set of Russian nesting dolls...",
    "conversation_id": "uuid",
    "model": "qwen3:8b",
    "created_at": "2026-10-11T12:10:00Z"
  }
  ```

#### `GET /api/ai/status`
- **Response `data`**:
  ```json
  {
    "available": true,
    "model": "qwen3:8b",
    "endpoint": "http://localhost:11434",
    "system_ram_ok": true,
    "status_message": "Ollama service connected and qwen3:8b ready"
  }
  ```

---

### 3.6 Admin Management
> [!CAUTION]
> All endpoints under `/api/admin/*` strictly require `role: ADMIN`. Non-admins receive HTTP 403 Forbidden.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin | Overview statistics (users, courses, quizzes, attempts) |
| `GET` | `/api/admin/users` | Admin | List registered users with roles and enrollment counts |
| `POST` | `/api/batches` | Admin | Create a batch; blank optional relationship IDs are stored as `null` |
| `PATCH` | `/api/batches/:batchId` | Admin | Update a batch; blank optional relationship IDs clear the association |
| `DELETE` | `/api/batches/:batchId` | Admin | Delete a batch and its teacher, student, and class-enrollment joins atomically |
| `POST` | `/api/admin/courses` | Admin | Create a new course |
| `PUT` | `/api/admin/courses/:id` | Admin | Update course metadata and published status |
| `DELETE` | `/api/admin/courses/:id` | Admin | Archive or delete a course |
| `POST` | `/api/admin/courses/:id/lessons` | Admin | Add a lesson to a course |
| `PUT` | `/api/admin/lessons/:id` | Admin | Update lesson content or order |
| `DELETE` | `/api/admin/lessons/:id` | Admin | Delete a lesson |
| `POST` | `/api/admin/quizzes` | Admin | Create a new quiz for a course |
| `POST` | `/api/admin/quizzes/:id/questions` | Admin | Add MCQ questions to a quiz |
| `POST` | `/api/admin/teachers/invite` | Admin | Invite a teacher via email |
| `GET` | `/api/admin/academic-sessions` | Admin | List academic sessions |
| `GET` | `/api/admin/classes` | Admin | List classes and batches |
| `POST` | `/api/admin/classes` | Admin | Create class |
| `GET` | `/api/admin/subjects` | Admin | List academic subjects |
| `POST` | `/api/admin/subjects` | Admin | Create academic subject |
| `GET` | `/api/admin/timetable` | Admin | Get institution-wide timetable |
| `POST` | `/api/admin/timetable` | Admin | Schedule timetable period |
| `GET` | `/api/admin/attendance` | Admin | Institutional attendance report |
| `GET` | `/api/admin/leave-requests` | Admin | Review teacher leave requests |
| `PUT` | `/api/admin/leave-requests/:id` | Admin | Approve or reject teacher leave |
| `GET` | `/api/admin/audit-logs` | Admin | View tamper-evident audit logs |

Optional foreign-key fields in admin timetable and live-class payloads normalize empty or whitespace-only strings to `null`.

---

### 3.7 Teacher Portal (`/api/teacher/*`)
> [!NOTE]
> All endpoints under `/api/teacher/*` require role `TEACHER` or `ADMIN`.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teacher/dashboard` | Teacher | Overview metrics (assigned classes, students, pending submissions) |
| `GET` | `/api/teacher/classes` | Teacher | Assigned classes and student rosters |
| `GET` | `/api/teacher/timetable` | Teacher | Teaching schedule by day of week |
| `GET` | `/api/teacher/attendance` | Teacher | Attendance records for an assigned class/date |
| `POST` | `/api/teacher/attendance` | Teacher | Mark bulk daily student attendance |
| `GET` | `/api/teacher/assignments` | Teacher | Authored assignments |
| `POST` | `/api/teacher/assignments` | Teacher | Create homework with deadline and marks |
| `GET` | `/api/teacher/assignments/:id/submissions` | Teacher | View student submissions for homework |
| `PUT` | `/api/teacher/assignments/submissions/:id` | Teacher | Grade and add feedback to submission |
| `GET` | `/api/teacher/materials` | Teacher | Uploaded study materials |
| `POST` | `/api/teacher/materials` | Teacher | Create study material attachment/link |
| `GET` | `/api/teacher/live-classes` | Teacher | Scheduled live lectures |
| `POST` | `/api/teacher/live-classes` | Teacher | Schedule a live lecture |
| `PUT` | `/api/teacher/live-classes/:id/status` | Teacher | Transition status (scheduled -> ongoing -> completed) |
| `GET` | `/api/teacher/syllabus` | Teacher | Syllabus curriculum topics and completion status |
| `PUT` | `/api/teacher/syllabus/:id` | Teacher | Mark syllabus topic completed |
| `GET` | `/api/teacher/leave` | Teacher | View personal leave requests |
| `POST` | `/api/teacher/leave` | Teacher | Submit leave request |

---

### 3.8 Student Portal (`/api/student/*`)
> [!NOTE]
> All endpoints under `/api/student/*` require authenticated `STUDENT` session.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/dashboard` | Student | Summary (attendance %, today's classes, pending homework) |
| `GET` | `/api/student/timetable` | Student | Weekly schedule of enrolled class |
| `GET` | `/api/student/attendance` | Student | Historical attendance records and present percentage |
| `GET` | `/api/student/assignments` | Student | Homework assigned to student's class with status |
| `POST` | `/api/student/assignments/:id/submit` | Student | Submit homework text/file |
| `GET` | `/api/student/materials` | Student | Subject study materials and lecture documents |
| `GET` | `/api/student/live-classes` | Student | Live video classes scheduled for enrolled class |
| `GET` | `/api/student/announcements` | Student | Class and institutional announcements |
| `GET` | `/api/student/tickets` | Student | Support & feedback tickets |
| `POST` | `/api/student/tickets` | Student | Open a support/feedback ticket |

---

### 3.9 File Uploads (`/api/upload/*`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | Authenticated | Upload file (multipart/form-data, field `file`, `category`) |
| `GET` | `/api/upload/files/:category/:filename` | Authenticated | Secure file retrieval with traversal protection |

---

### 3.10 LiveKit WebRTC Video (`/api/livekit/*`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/livekit/status` | Public | Provider status & external meeting fallback report |
| `POST` | `/api/livekit/token` | Authenticated | Generate WebRTC room token for live lecture |
