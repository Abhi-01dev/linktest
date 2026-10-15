# LinkTest — Complete AI Learning Management System (LMS)

> **"Learn Smarter. Practice Better. Test Your Progress."**

LinkTest is a full-stack, enterprise-grade educational Learning Management System (LMS) inspired by modern educational platforms. Built with React, Node.js + Express, PostgreSQL, and local AI tutoring via Ollama (`qwen2.5:0.5b`) with cloud fallback options, LinkTest delivers dedicated, responsive portals for **Students**, **Teachers**, and **Administrators**.

---

## 1. Key Features & Portals

### 🎓 Student Portal (`/student/*`)
- **Dashboard:** Attendance metrics, daily class schedule, pending homework, syllabus status, enrolled courses.
- **Academic Timetable:** Weekly timetable filterable by weekday.
- **Attendance History:** Real-time present, late, and absent tracking with institutional percentages.
- **Assignments & Homework:** View active homework assignments, submit responses with text and file attachments.
- **Quizzes & Tests:** Interactive test-taking with randomized options, client-side answer scrub, server-side grading, and instant scorecards.
- **Study Materials:** View and download lecture notes, PDFs, presentations, and reference links by subject.
- **Live Classes:** Join scheduled live video lectures via integrated WebRTC or Google Meet / Zoom / Teams fallback.
- **AI Study Tutor:** 24/7 intelligent mentor for concept breakdowns, practice questions, and code explanations.
- **Support & Feedback:** Submit administrative, academic, or technical support tickets.

### 👨‍🏫 Teacher Portal (`/teacher/*`)
- **Teacher Dashboard:** Summary metrics for assigned classes, active students, pending assignment evaluations, and upcoming lectures.
- **Assigned Classes & Rosters:** Roster explorer with student contact information, enrollment IDs, and guardian details.
- **Attendance Marking:** Bulk daily student attendance marking (Present, Absent, Late) with persistent storage.
- **Homework Authoring & Review:** Create assignments with issue dates, deadlines, and maximum marks; evaluate and grade submissions.
- **Study Materials Upload:** Publish lecture notes, PDFs, and learning documents directly to assigned classes.
- **Live Class Scheduling:** Schedule, broadcast ("Go Live"), and complete video lecture sessions.
- **Syllabus Progress Tracker:** Chapter and topic curriculum tracker (Planned vs. Completed dates).
- **Leave Requests:** Submit institutional leave applications and track administrator approval status.

### 🏛️ Administrator Portal (`/admin/*`)
- **Institutional Oversight:** High-level analytics across total students, faculty, classes, courses, and active sessions.
- **Student & Faculty Management:** Directory management, account status toggles (Active / Suspended), and teacher email invitations.
- **Academic Structure:** Complete management of Academic Sessions, Classes, Batches / Divisions, Subjects, and Teacher Assignments.
- **Timetable Scheduler:** Master timetable scheduling with conflict checks across rooms and periods.
- **Attendance Oversight:** Institution-wide attendance percentage tracking and student risk identification.
- **Audit Logging:** Tamper-evident activity logs recording authentication, role modifications, and system events.
- **Reports & Analytics:** Visual charts (powered by Recharts) showing enrollment trends and academic performance.

---

## 2. Administrator Access & Production Setup

Create an administrator using the production setup procedure:

```bash
# Provision or configure administrator credentials
ADMIN_EMAIL="admin@linktest.io" ADMIN_PASSWORD="your-secure-password" npm --prefix backend run create-admin
```

Once provisioned, sign in to the platform at [http://localhost:5173/login](http://localhost:5173/login) using your configured administrator credentials.


---

## 3. Fast Start with Windows PowerShell

### Step 1: Open Windows PowerShell

```powershell
cd c:\Users\abhis\linktest
```

### Step 2: Install All Dependencies (Root, Backend, and Frontend)

```powershell
npm run install:all
```

### Step 3: Start Both Services Concurrently

```powershell
npm run dev
```

Or run them in dedicated terminal windows:
- **Backend (Port 8081 - Node.js + Express):** `cd backend; npm run dev`
- **Frontend (Port 5173 - React/Vite):** `cd frontend; npm run dev`

Open your browser at: **`http://localhost:5173`**

---

## 4. System Health Checks

Verify your backend and database status:
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/health" | ConvertTo-Json
```

Verify WebRTC LiveKit status:
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/livekit/status" | ConvertTo-Json
```

Verify AI Tutor status:
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/ai/status" | ConvertTo-Json
```

---

## 5. Google Sign-In (OAuth 2.0 & OpenID Connect) Setup Guide

LinkTest implements enterprise-grade, cryptographically verified Google Sign-In using Google Identity Services (GIS) on the frontend and official `google-auth-library` verification on the backend.

### Step 1: Create a Project in Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **New Project**.
3. Name your project (e.g., `LinkTest-LMS`) and click **Create**.

### Step 2: Configure the OAuth Consent Screen
1. In the sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless your organization uses Google Workspace and you only want internal members) and click **Create**.
3. Fill in the required application information:
   - **App name**: `LinkTest AI Learning Platform`
   - **User support email**: Your Gmail address
   - **Developer contact information**: Your Gmail address
4. Click **Save and Continue**.
5. In the **Scopes** step, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**.
7. In the **Test users** step (while the app is in Testing status):
   - Click **Add Users**.
   - Add your Gmail address and any test student/teacher Gmail accounts.
8. Click **Save and Continue**.

### Step 3: Create OAuth 2.0 Web Client Credentials
1. In the sidebar, navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** at the top and select **OAuth client ID**.
3. For **Application type**, choose **Web application**.
4. Set **Name** to `LinkTest Web Client`.
5. Under **Authorized JavaScript origins**, click **Add URI** and enter:
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://127.0.0.1:5173`
   - *(Add your deployed production frontend domain when deploying)*
6. Under **Authorized redirect URIs**, click **Add URI** and enter:
   - `http://localhost:8081/api/auth/google/callback`
   - `http://localhost:5173`
   - `http://localhost:5174`
7. Click **Create**.
8. A modal will display your **Client ID** and **Client Secret**. Copy both values.

### Step 4: Configure Environment Variables

**Backend (`backend/.env`):**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback
```
*(Never commit `backend/.env` with secrets to git!)*

**Frontend (`frontend/.env`):**
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```
*(Only the public client ID goes to the frontend. Never expose `GOOGLE_CLIENT_SECRET` in Vite variables!)*

### Step 5: How Google Sign-In & Account Linking Works
1. **New User**: Selecting "Continue with Google" securely verifies the Google ID token (`sub`, `iss`, `aud`, `email_verified`). An account is created strictly with the `STUDENT` role (preventing privilege escalation) and issued a LinkTest JWT session.
2. **Existing Account Linking**: If an account with the verified Google email already exists, LinkTest links the Google identity without creating duplicate accounts, preserving existing course enrollments, quiz attempts, mock test records, and password.
3. **Unlink Protection**: Users can unlink Google from their Student Profile only if they have a local password set, ensuring zero risk of account lockout.

---

## 6. App-Wide Performance Optimizations

LinkTest includes extensive architectural optimizations across the entire stack:

- **Frontend Bundle Splitting:** Route-level dynamic imports with `React.lazy()` and `<Suspense fallback={<PageLoader />}>`. Vite `manualChunks` segments heavy third-party libraries (`vendor-react`, `vendor-charts`, `vendor-icons`), reducing initial page load weight to just ~56 kB (12.9 kB gzipped).
- **Search & Input Debouncing:** Reusable `useDebounce` hook minimizes re-renders and unnecessary network requests on search inputs.
- **Backend Request Tracing & Error Masking:** `X-Request-Id` tracking middleware attaches UUIDs to every incoming request. Production errors mask internal stack traces while logging structured diagnostics server-side.
- **Granular Database Indexing:** High-performance B-tree indexes on `users(google_id)`, `users(auth_provider)`, `users(LOWER(email))`, `quiz_attempts(user_id)`, and `mock_test_attempts(student_id)`.
- **Strict CORS Policy:** Restricted to authorized frontend origins (`5173`, `5174`, `3000`, and production domain).
- **Graceful Persistence Diagnostics:** Unreachable PostgreSQL instances log prominent alerts and report diagnostic status via `/api/health`.

---

## 7. Automated Testing Suite

LinkTest features an automated test suite verifying auth security, RBAC, assessments, and Google Sign-In:

```powershell
cd backend
npm test
```

### Test Suite Summary:
- **`tests/api.test.js`**: 23 tests (Health, OTP registration, brute-force lockout, cooldown, anti-tamper role enforcement, admin RBAC, quiz evaluation, AI diagnostics).
- **`tests/google_auth.test.js`**: 10 tests (Token validation, signature checks, issuer trust, audience mismatch, unverified email rejection, student role enforcement, account linking, lockout prevention on unlinking).
- **`tests/lms_modules.test.js`**: 7 tests (LiveKit WebRTC, faculty class access, timetable, attendance, upload authorization, audit logging).
- **`tests/mock_tests.test.js`**: 11 tests (Test creation, publish pipeline, answer sanitization, auto-submit on timer expiry, anti-cheating proctoring events, gradebook).

**Total: 51 tests across 4 suites — 51 passing, 0 failing.**

Verify frontend build:
```powershell
cd frontend
npm run build
```
*(Produces optimized micro-chunks in ~15s).*

---

## 8. Comprehensive Documentation Index

Full operational and architecture documentation is available in the [`docs/`](./docs) folder:

- 📋 [**Configuration Audit (`docs/CONFIGURATION-AUDIT.md`)**](./docs/CONFIGURATION-AUDIT.md) — Detailed feature-by-feature classification of all subsystems.
- 🚀 [**Local Setup Guide (`docs/SETUP-GUIDE.md`)**](./docs/SETUP-GUIDE.md) — Step-by-step Windows PowerShell commands and prerequisites.
- 🌐 [**Deployment Guide (`docs/DEPLOYMENT-GUIDE.md`)**](./docs/DEPLOYMENT-GUIDE.md) — Cloud deployment guide for Vercel, Render/Railway, and Neon PostgreSQL.
- 🔑 [**Environment Variables (`docs/ENVIRONMENT-VARIABLES.md`)**](./docs/ENVIRONMENT-VARIABLES.md) — Full dictionary of every frontend and backend environment variable.
- 📡 [**API Contract Specification (`docs/API-CONTRACT.md`)**](./docs/API-CONTRACT.md) — REST API endpoints, request schemas, and responses.
- 🧪 [**Automated Test Report (`docs/TEST-REPORT.md`)**](./docs/TEST-REPORT.md) — Exact automated test results and coverage logs.

