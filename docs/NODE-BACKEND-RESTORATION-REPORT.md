# LINKTEST — NODE.JS/EXPRESS BACKEND RESTORATION & HEALTH REPORT

**Date:** October 14, 2026  
**Status:** **OPERATIONAL & VERIFIED (100% GREEN)**  
**Target Architecture:** React/Vite Frontend (`http://localhost:5173`) ↔ Node.js/Express Backend (`http://localhost:8081`) ↔ PostgreSQL (Neon Cloud)

---

## 1. Executive Summary

As requested, the original Node.js + Express backend has been **fully restored** as the active development and production backend for the LinkTest AI Learning Platform. The previous Java Spring Boot backend migration has been halted, and the `backend-java/` directory has been preserved untouched as an archive for future reference.

All user data, courses, batches, mock tests, attempts, responses, and audit logs stored in the remote PostgreSQL Neon database (`neondb`) were **strictly preserved with zero data loss and no table drops or resets**.

Key outcomes:
- **Node.js/Express Backend:** Active on `http://localhost:8081` (PID active, fully configured with Gmail SMTP, LiveKit WebRTC, and Ollama AI integration).
- **React/Vite Frontend:** Active on `http://localhost:5173` with clean production build (`✓ built in 31.94s`).
- **PostgreSQL Database:** Connected to Neon cloud database with all 45 tables verified and intact.
- **Node Unit Tests:** **94 / 94 PASSED (100%)** across all 8 test suites.
- **End-to-End Workflows:** **19 / 19 PASSED (100%)** across all admin, teacher, student, examination, AI, and LiveKit WebRTC workflows.

---

## 2. Directory Structure & Workspace State

```
c:\Users\abhis\linktest\
├── backend/                  <-- RESTORED ACTIVE NODE.JS/EXPRESS BACKEND
│   ├── src/
│   │   ├── config/           <-- Environment variables & constants
│   │   ├── controllers/      <-- Admin, Auth, Batch, MockTest, Question, LMS controllers
│   │   ├── db/               <-- PostgreSQL connection pool & resilient fallback
│   │   ├── middleware/       <-- Auth JWT, RBAC, error handling, rate limiting
│   │   ├── repositories/     <-- SQL persistence layer
│   │   ├── routes/           <-- Express API routes mounted under /api
│   │   ├── services/         <-- LiveKit, AI, QuestionBank, Email, MockTest services
│   │   └── utils/            <-- CSV parser, password hashing, proctoring
│   ├── tests/                <-- 8 comprehensive test suites (94 tests)
│   ├── .env                  <-- Configured for Neon PostgreSQL, LiveKit, Google OAuth
│   └── package.json          <-- Node backend dependencies
├── backend-java/             <-- UNTOUCHED ARCHIVE / BACKUP (No active processes)
├── frontend/                 <-- REACT 18 + VITE FRONTEND (Active on port 5173)
│   ├── src/
│   ├── .env                  <-- VITE_API_URL=http://localhost:8081/api
│   └── package.json
├── docs/                     <-- Architectural & operational documentation
├── package.json              <-- Root orchestration scripts (dev:backend, dev:frontend)
└── test-all-e2e.ps1          <-- 19-step automated end-to-end verification suite
```

---

## 3. Database Verification & Data Preservation

The PostgreSQL database hosted on Neon Cloud was inspected and validated. **No tables were dropped, truncated, or reset.**

### Table Inventory & Record Counts
| Entity / Table | Record Count | Status |
| :--- | :--- | :--- |
| `users` | **188** records | Intact (Admin, Teachers, Students) |
| `courses` | **5** courses | Intact |
| `batches` | **13** batches | Intact |
| `batch_teachers` | **11** assignments | Intact |
| `batch_enrollments` | **1** enrollment | Intact |
| `mock_tests` | **26** examinations | Intact |
| `mock_test_questions` | **115** questions | Intact |
| `mock_test_attempts` | **35** attempts | Intact |
| `mock_test_responses` | **114** responses | Intact |
| `security_audit_logs` | **415** events | Preserved & actively appending |
| `audit_logs` | **321** entries | Preserved & actively appending |
| `subjects` | **5** curriculum subjects | Intact |
| `classes` | **2** classes (`CS-A`, `CS-B`) | Intact |

---

## 4. Resolved Regressions & Bug Fixes

### 1. Mock Test Runner `attempts/undefined` Error
- **Root Cause:** When starting a mock test attempt, `MockTestPreCheckPage.jsx` and `MockTestRunnerPage.jsx` look for `data?.attempt_id || data?.attemptId || data?.attempt?.id || data?.id`. The backend response previously only returned `attempt_id`. When navigating to `/mock-tests/runner/:attemptId`, if an alternate property naming was queried by components, `:attemptId` resolved to literal `"undefined"`.
- **Resolution:**
  1. Updated `mockTestService.getAttemptForTaker()` and `mockTestController.startAttempt()` to return normalized payload objects containing `attempt_id`, `attemptId`, `id`, and a nested `attempt: { id, ... }` object.
  2. Added defensive validation in `mockTestController.js` for all attempt endpoints (`getAttempt`, `saveAnswer`, `logProctoringEvent`, `submitAttempt`, `getAttemptResult`), immediately rejecting literal string `"undefined"` or empty parameters with HTTP 400 `INVALID_ATTEMPT_ID` and a clear error message.

### 2. Batch Creation Foreign Key Constraint Violation (`batches_course_id_fkey`)
- **Root Cause:** In the frontend batch modal (`AdminBatchesPage.jsx`), selecting "No curriculum tied" submitted `course_id: ""`. PostgreSQL evaluates empty string `""` as an invalid UUID string rather than `NULL`, triggering constraint violation `batches_course_id_fkey`.
- **Resolution:**
  1. Implemented `sanitizeOptionalString` utility in `batchController.js` and `batchRepository.js` that transforms empty/whitespace strings `""` to `null` across all foreign key fields (`course_id`, `class_id`, `class_teacher_id`, `start_date`, `end_date`).
  2. Added Zod schema preprocessors to support case-insensitive status inputs (`'active'` → `'Active'`) and allow `max_capacity` as an alias for `capacity`.
  3. Added relational cascade cleanup in `batchRepository.deleteBatch()` to ensure that when an admin deletes a batch, join records in `batch_enrollments` and `batch_teachers` are properly removed.

### 3. Bulk Question CSV Import & Validation
- **Root Cause:**
  1. Teachers assigned to subjects such as `"Computer Science Fundamentals"` were previously denied permission when uploading questions labeled with stem name `"Computer Science"` due to one-way substring matching.
  2. The CSV preview response wrapped row counts in `data.summary`, while testing clients expected top-level `validCount` and `totalRows`.
- **Resolution:**
  1. Updated `questionBankService.js` and `questionBankController.js` to perform bidirectional subject matching (`authSub === subNorm || subNorm.includes(authSub) || authSub.includes(subNorm)`).
  2. Exposed top-level `validCount`, `valid_count`, `totalRows`, and `errors` on `/api/questions/csv/preview` alongside the detailed `summary` and `rows` collections.

### 4. Academic Reports CSV Export Header
- **Resolution:** Updated `adminController.exportReportsCSV()` to include `Attempt ID` as the primary CSV column, ensuring full compliance with administrative export standards.

---

## 5. Verification & Test Outcomes

### A. Node.js Unit & Integration Test Suites
Executed via Node.js Native Test Runner (`backend/tests/`):

| Test Suite | File | Tests | Result | Duration |
| :--- | :--- | :---: | :---: | :---: |
| LinkTest API End-to-End Suite | `api.test.js` | 23 | **PASSED** | 19.3s |
| Batches & Faculty Roles Suite | `batches_and_roles.test.js` | 12 | **PASSED** | 8.8s |
| LiveKit WebRTC Live Lectures | `live_lectures_livekit.test.js` | 11 | **PASSED** | 11.4s |
| LMS Modules & Integration | `lms_modules.test.js` | 7 | **PASSED** | 4.1s |
| Mock Test & AI Examination | `mock_tests.test.js` | 11 | **PASSED** | 10.5s |
| Google OAuth Security | `google_auth.test.js` | 10 | **PASSED** | 4.2s |
| Bulk Question CSV Import | `bulk_question_import.test.js` | 11 | **PASSED** | 3.8s |
| Audit Logs & Academic Reports | `audit_and_reports.test.js` | 9 | **PASSED** | 4.6s |
| **TOTAL** | **8 Suites** | **94** | **94 / 94 PASSED (100%)** | **32.1s** |

### B. Automated End-to-End System Tests (`test-all-e2e.ps1`)
Executed against running services (`http://localhost:8081` and Neon PostgreSQL):

| Step | Workflow | Status | Details |
| :---: | :--- | :---: | :--- |
| **1** | Health Endpoint | **PASSED** | Status: `operational`, Platform: `LinkTest Node.js Express Backend` |
| **2** | AI Tutor Diagnostics | **PASSED** | Model: `qwen2.5:0.5b`, Available: `true` |
| **3** | LiveKit WebRTC Diagnostics | **PASSED** | Provider: `livekit`, Server: `wss://linktest-c533w241.livekit.cloud` |
| **4** | Admin Authentication | **PASSED** | Logged in as: `Dr. Priya Patel (ADMIN)` |
| **5** | Teacher Authentication | **PASSED** | Logged in as: `Prof. Rajesh Kulkarni (TEACHER)` |
| **6** | Student Authentication | **PASSED** | Logged in as: `Aarav Sharma (STUDENT)` |
| **7** | Security: Reject Unauthenticated | **PASSED** | Correctly rejected with HTTP 401 |
| **8** | Security: Reject Student from Admin | **PASSED** | Correctly forbidden with HTTP 403 |
| **9** | Admin Dashboard & User Management | **PASSED** | Retrieved user directories, system statistics |
| **10** | Admin Batch & Teacher Assignment | **PASSED** | Batch created with null foreign key safety; teacher allocated |
| **11** | Student Batch Enrollment | **PASSED** | Student enrolled into batch |
| **12** | CSV Question Template Download | **PASSED** | RFC 4180 compliant template downloaded |
| **13** | CSV Question Preview & Validation | **PASSED** | Valid rows: 1, Total rows: 1 |
| **14** | CSV Question Import Execution | **PASSED** | 1 question imported with `duplicateStrategy = "skip"` |
| **15** | Student Examination Flow | **PASSED** | Created, published, attempted, autosaved, submitted, scored (5/10) |
| **16** | Audit Logs Inspection | **PASSED** | 321 entries verified |
| **17** | Security Logs Inspection | **PASSED** | 415 entries verified |
| **18** | Reports Overview & CSV Export | **PASSED** | Academic report retrieved and CSV exported |
| **19** | Cleanup E2E Test Batch | **PASSED** | Temporary batch and allocations cleaned up |

**Overall E2E Result: 19 / 19 PASSED (100% Success)**

### C. Frontend Production Build
- Command: `npm run build` in `frontend/`
- Outcome: `✓ built in 31.94s`
- Zero compile errors, zero TypeScript/JSX errors.

---

## 6. Runtime Configuration & Port Mapping

| Service | Technology | Port / URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 / Vite | `http://localhost:5173` | Active & Listening |
| **Backend** | Node.js / Express | `http://localhost:8081` | Active & Listening |
| **API Base URL** | Express REST Router | `http://localhost:8081/api` | Active |
| **Database** | PostgreSQL | Neon Cloud (`ep-rapid-morning-...`) | Connected via Pool |
| **WebRTC Media** | LiveKit Cloud | `wss://linktest-c533w241.livekit.cloud` | Operational |
| **AI LLM** | Ollama | `http://127.0.0.1:11434` (qwen2.5:0.5b) | Operational |

---

## 7. How to Operate the Project

### Start Services (Development)
From the workspace root directory:

```powershell
# Option 1: Start both frontend and backend concurrently
npm run dev

# Option 2: Start backend only (port 8081)
npm run dev:backend

# Option 3: Start frontend only (port 5173)
npm run dev:frontend
```

### Run Tests
```powershell
# Run all backend unit test suites (94 tests)
npm run test:backend

# Run comprehensive end-to-end integration tests (19 workflows)
powershell -ExecutionPolicy Bypass -File .\test-all-e2e.ps1
```

### Health Check Endpoints
- **System Health:** `GET http://localhost:8081/api/health`
- **AI Engine Status:** `GET http://localhost:8081/api/ai/status`
- **LiveKit Status:** `GET http://localhost:8081/api/livekit/status`

---

## 8. Conclusion

The LinkTest platform has been successfully stabilized and restored to the robust Node.js/Express architecture. All existing database records remain intact, all 94 unit tests and 19 end-to-end workflows pass with 100% reliability, and the frontend communicates smoothly with the restored backend on port 8081.
