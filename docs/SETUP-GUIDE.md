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

## 3. Administrator Access & Production Setup

Create an administrator using the production setup procedure:

```bash
ADMIN_EMAIL="admin@linktest.io" ADMIN_PASSWORD="your-secure-password" npm --prefix backend run create-admin
```

Once provisioned, sign in to the platform at **`http://localhost:5173/login`** using your configured administrator credentials.


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

### D. Cloud AI Deployment (Groq / OpenAI / Gemini / OpenRouter)
In production deployments (such as Render, Railway, AWS, DigitalOcean, or Fly.io), running local Ollama on the server requires expensive dedicated GPUs or high RAM. Instead, LinkTest has a built-in Cloud AI provider layer that connects to any OpenAI-compatible API.

All 3 AI features in LinkTest automatically use the Cloud AI provider when configured:
1. **AI Study Tutor (`/ai-tutor`)** — Student interactive tutoring with conversation history.
2. **AI Quiz Generation (`/api/ai/generate-quiz`)** — Generates instant multiple choice quizzes on any topic.
3. **Teacher AI Mock Test Generator (`/mock-tests/builder`)** — Generates exam questions from syllabus topics.

#### 1. Recommended: Groq (Free & Blazing Fast)
1. Sign up at [https://console.groq.com](https://console.groq.com) and generate a free API key.
2. Add these environment variables in your deployed backend (e.g. Render/Railway Environment Settings):
   ```env
   CLOUD_AI_PROVIDER=groq
   CLOUD_AI_API_KEY=gsk_your_groq_api_key_here
   CLOUD_AI_BASE_URL=https://api.groq.com/openai/v1
   CLOUD_AI_MODEL=llama-3.1-8b-instant
   ```
   *(Alternative fast model: `llama-3.3-70b-versatile`)*

#### 2. Alternative: OpenAI
```env
CLOUD_AI_PROVIDER=openai
CLOUD_AI_API_KEY=sk-proj-your_openai_api_key_here
CLOUD_AI_BASE_URL=https://api.openai.com/v1
CLOUD_AI_MODEL=gpt-4o-mini
```

#### 3. Alternative: Google Gemini (OpenAI Compatibility Mode)
```env
CLOUD_AI_PROVIDER=gemini
CLOUD_AI_API_KEY=AIzaSy_your_gemini_api_key_here
CLOUD_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
CLOUD_AI_MODEL=gemini-1.5-flash
```

#### 4. Alternative: Remote Self-Hosted Ollama
If you host Ollama on an external GPU VPS or cloud VM:
```env
OLLAMA_BASE_URL=https://your-remote-ollama-host:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

#### 5. Verifying Deployment
Once deployed, check your AI status endpoint:
```bash
curl https://your-backend-domain.com/api/ai/status
```
It should return:
```json
{
  "success": true,
  "data": {
    "available": true,
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "is_cloud": true,
    "status_message": "Cloud AI provider (groq) is configured with model llama-3.3-70b-versatile."
  }
}
```
In the LinkTest web UI:
- Navigate to `/ai-tutor`: the top-right badge will show **Cloud AI (groq) Active**.
- Navigate to the Teacher Test Builder (`/mock-tests/builder`): the AI Question Generator banner will show **Cloud AI Active**.
