# LinkTest — Team Workflow & Collaboration Guide

## 1. Overview & Team Structure
The **LinkTest** AI Learning Platform is developed by a four-person engineering team collaborating in a monorepo via Git and GitHub. To maximize velocity and eliminate integration bottlenecks, each engineer owns dedicated domains while adhering strictly to the shared **API Contract** (`docs/API-CONTRACT.md`).

---

## 2. Team Roles & Responsibilities

| Person | Role | Key Responsibilities | Primary Owned Directories |
| :--- | :--- | :--- | :--- |
| **Person 1** | **Project Lead & Frontend Integration** | • Project architecture & monorepo orchestration<br>• Frontend routing & application shell<br>• Landing page, public pages, global layout & navigation<br>• Student dashboard & design system tokens<br>• GitHub PR review & final deployment | `frontend/src/components/common/`<br>`frontend/src/layouts/`<br>`frontend/src/pages/` (Landing, Dashboard)<br>`frontend/src/styles/` |
| **Person 2** | **Backend, Database & Authentication** | • Express server & PostgreSQL schema<br>• Migrations & database seed scripts<br>• JWT authentication & bcrypt password hashing<br>• Role-based access control (`STUDENT`, `ADMIN`)<br>• Input validation (Zod) & secure headers/rate limits | `backend/src/config/`<br>`backend/src/middleware/`<br>`backend/src/routes/auth.js`<br>`backend/src/db/`<br>`backend/sql/`<br>`backend/scripts/` |
| **Person 3** | **Learning Modules (Courses, Lessons & Quizzes)** | • Course catalogue, search & filtering UI<br>• Lesson viewer & completion tracking<br>• MCQ quiz taker, client state & results review<br>• Admin course, lesson & quiz editor UI<br>• Backend course/lesson/quiz controllers & repositories | `frontend/src/features/courses/`<br>`frontend/src/features/quizzes/`<br>`frontend/src/features/admin/`<br>`backend/src/routes/courses.js`<br>`backend/src/routes/quizzes.js`<br>`backend/src/routes/admin.js` |
| **Person 4** | **AI Tutor & AI Testing** | • AI study tutor interactive chat UI<br>• Ollama service integration (`qwen3:8b`)<br>• Educational system prompting & practice MCQ generation<br>• Graceful offline diagnostics & latency indicators<br>• AI test suites & rate limiting | `frontend/src/features/ai-tutor/`<br>`backend/src/services/ai/`<br>`backend/src/routes/ai.js`<br>`backend/tests/ai/` |

---

## 3. Git Branching & Workflow Rules

### Feature Branches
All feature development must take place on dedicated branches branched off `main`:
- `feature/app-shell` — Person 1: Shell, navigation, design system, landing page.
- `feature/auth-backend` — Person 2: Express scaffold, PostgreSQL schema, JWT, login/register.
- `feature/learning-modules` — Person 3: Course catalogue, lesson player, quiz engine, admin editor.
- `feature/ai-tutor` — Person 4: AI tutor interface, Ollama client, practice generator.

### Commit Conventions
Follow Conventional Commits:
- `feat(auth): implement JWT token verification middleware`
- `feat(courses): add lesson completion toggle with backend persistence`
- `feat(ai): integrate Ollama qwen3:8b stream and fallback error state`
- `fix(quiz): prevent client-side answer leakage prior to submission`
- `docs(api): document quiz attempt schema and rate limits`

---

## 4. Cross-Team Integration Rules

1. **API Contract First**: Always consult `docs/API-CONTRACT.md` before implementing client or server endpoints. No endpoint URL or response payload changes are permitted without team consensus.
2. **Standard Response Envelope**:
   - Success: `{ "success": true, "data": ..., "message": "..." }`
   - Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`
3. **Mock Data Rule**: When a frontend feature is ready before its backend counterpart, use isolated mock data in `frontend/src/services/mocks/`. As soon as the backend endpoint is merged, replace the mock with the centralized `apiClient`. Never ship mock data in production builds.
4. **No Destructive Overwrites**: Each developer works within their assigned directory ownership. Global files (e.g. `App.jsx`, `server.js`) require peer coordination.
5. **Continuous Verification**: Run `npm run test` and `npm run build` before pushing any branch or opening a pull request.
