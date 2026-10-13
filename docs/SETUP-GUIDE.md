# LinkTest LMS — Local Setup & Development Guide

This guide provides exact, tested Windows PowerShell instructions to set up, start, test, and run the LinkTest Learning Management System locally.

---

## 1. System Requirements

- **Operating System:** Windows 10/11, macOS, or Linux
- **Node.js:** v18.0.0 or higher (v22.x verified)
- **npm:** v9.x or higher (v10.x verified)
- **Git:** Installed and available in PATH

---

## 2. Fast Start (Dual-Mode / Zero External Dependencies)

LinkTest includes an intelligent dual-mode architecture:
- If PostgreSQL is absent, an in-memory transactional store (`InMemoryStore`) initializes automatically with complete seed data.
- If Gmail SMTP is unconfigured, verification OTPs and invite links log directly to the server terminal.
- If local Ollama is not running, the AI Tutor provides guided onboarding instructions.

### Step 1: Open Windows PowerShell in the Project Root

```powershell
cd c:\Users\abhis\linktest
```

### Step 2: Install All Dependencies

```powershell
npm run install:all
```

### Step 3: Start Both Backend and Frontend Concurrently

```powershell
npm run dev
```

Alternatively, run in two separate PowerShell windows:

**Window 1 (Backend API on port 8081):**
```powershell
cd c:\Users\abhis\linktest\backend
npm run dev
```

**Window 2 (Frontend Client on port 5173):**
```powershell
cd c:\Users\abhis\linktest\frontend
npm run dev
```

---

## 3. Accessing the Platform & Seed Credentials

Open your web browser at: **`http://localhost:5173`**

You can use the **1-Click Demo Fill** buttons on the Login page (`http://localhost:5173/login`) or use the following pre-seeded credentials:

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **Student** | `student@linktest.io` | `Student123!` | `http://localhost:5173/student/dashboard` |
| **Teacher** | `teacher@linktest.io` | `Teacher123!` | `http://localhost:5173/teacher/dashboard` |
| **Admin** | `admin@linktest.io` | `Admin123!` | `http://localhost:5173/admin/dashboard` |

---

## 4. Verifying System Health

Test the backend health check and diagnostics endpoint from PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/health" | ConvertTo-Json
```

Expected output:
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "name": "LinkTest API Server",
    "version": "1.0.0",
    "database": {
      "isPostgres": false,
      "type": "InMemoryFallback"
    }
  }
}
```

Check the WebRTC LiveKit status endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/livekit/status" | ConvertTo-Json
```

Check the AI Tutor model status endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/ai/status" | ConvertTo-Json
```

---

## 5. Running Automated Tests

Run the complete 30-test backend integration suite:

```powershell
cd c:\Users\abhis\linktest\backend
npm test
```

Test Gmail SMTP connectivity safely:

```powershell
cd c:\Users\abhis\linktest\backend
npm run test:smtp
```

Run the frontend production build validation:

```powershell
cd c:\Users\abhis\linktest\frontend
npm run build
```

---

## 6. Configuring Optional Services

### A. Real PostgreSQL Database
To connect a local or cloud PostgreSQL instance (such as Neon):
1. In `backend/.env`, set:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/linktest
   # Or for Neon:
   # DATABASE_URL=postgresql://neondb_owner:KEY@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
2. Run database migration:
   ```powershell
   npm run db:migrate
   ```
3. Populate initial seed data:
   ```powershell
   npm run db:seed
   ```

### B. Gmail SMTP Email Verification
1. Enable 2-Step Verification in your Google Account.
2. Generate a 16-character **App Password** at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. In `backend/.env`, add:
   ```env
   SMTP_USER=your_email@gmail.com
   SMTP_APP_PASSWORD=your16charpassword
   ```
4. Verify your credentials:
   ```powershell
   npm run test:smtp
   ```

### C. Local Ollama AI Tutor (`qwen3:8b`)
1. Download Ollama from [https://ollama.com](https://ollama.com).
2. Start the Ollama server:
   ```powershell
   ollama serve
   ```
3. Pull the educational model:
   ```powershell
   ollama pull qwen3:8b
   ```
4. LinkTest will detect the active model automatically on `http://localhost:11434`.

### D. Cloud AI Tutor (Groq / OpenAI Fallback)
For cloud deployments where local Ollama is unavailable:
1. In `backend/.env`, add:
   ```env
   CLOUD_AI_PROVIDER=groq
   CLOUD_AI_API_KEY=gsk_your_groq_api_key
   CLOUD_AI_MODEL=llama-3.1-8b-instant
   ```
