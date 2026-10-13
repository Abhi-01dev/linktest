# LinkTest LMS — Environment Variables Reference

This document catalogs every environment variable recognized by the LinkTest platform across frontend and backend services.

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable | Type / Default | Required Local | Required Online | Where to Obtain / Notes | How to Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PORT` | Number (`8081`) | Optional | Optional | Configured by hosting provider (Render sets this dynamically). | Verify terminal output on server startup. |
| `NODE_ENV` | `development` / `production` | Optional | **Yes** | Set to `production` in live environments. | Inspect `GET /api/health`. |
| `DATABASE_URL` | PostgreSQL URI | Optional | **Yes** | Local: `postgresql://postgres:pass@localhost:5432/linktest`<br>Neon: `https://neon.tech` connection string. | Inspect `GET /api/health` -> `database.isPostgres`. |
| `JWT_SECRET` | String | Optional (dev fallback) | **Yes** | Generate 64 random bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. | Auth login & token decoding. |
| `FRONTEND_URL` | URL (`http://localhost:5173`) | Optional | **Yes** | URL of deployed frontend (e.g., `https://linktest.vercel.app`) for CORS origin validation. | Preflight `OPTIONS` requests from frontend. |
| `SMTP_HOST` | Hostname (`smtp.gmail.com`) | Optional | Optional | Default `smtp.gmail.com`. | Run `npm run test:smtp`. |
| `SMTP_PORT` | Number (`587`) | Optional | Optional | 587 for STARTTLS (recommended) or 465 for SSL. | Run `npm run test:smtp`. |
| `SMTP_SECURE` | Boolean (`false`) | Optional | Optional | Set `false` when using port 587 with STARTTLS. | Run `npm run test:smtp`. |
| `SMTP_USER` | Email address | Optional | **Yes** (for live emails) | Google Account email address. | Run `npm run test:smtp`. |
| `SMTP_APP_PASSWORD` | 16-char string | Optional | **Yes** (for live emails) | Generate at [Google App Passwords](https://myaccount.google.com/apppasswords). | Run `npm run test:smtp`. |
| `SMTP_FROM_NAME` | String (`LinkTest`) | Optional | Optional | Display name in outgoing emails. | Inspect received email header. |
| `SMTP_FROM_EMAIL` | Email address | Optional | Optional | Defaults to `SMTP_USER`. | Inspect received email sender. |
| `OLLAMA_BASE_URL` | URL (`http://localhost:11434`) | Optional | No | Local Ollama endpoint. Not recommended to expose over public internet. | Inspect `GET /api/ai/status`. |
| `OLLAMA_MODEL` | String (`qwen3:8b`) | Optional | No | AI model name configured in Ollama. | Inspect `GET /api/ai/status`. |
| `CLOUD_AI_PROVIDER` | `groq` / `openai` | No | **Yes** (if Ollama offline) | Cloud provider type. | Chat with AI tutor online. |
| `CLOUD_AI_API_KEY` | String | No | **Yes** (if Ollama offline) | Obtain from [Groq](https://console.groq.com) or OpenAI. | Chat with AI tutor online. |
| `CLOUD_AI_BASE_URL` | URL | No | Optional | `https://api.groq.com/openai/v1` or custom proxy. | Chat with AI tutor online. |
| `CLOUD_AI_MODEL` | String | No | Optional | Defaults to `llama-3.1-8b-instant`. | Chat with AI tutor online. |
| `STORAGE_PROVIDER` | `local` / `supabase` | Optional | Optional | Storage engine. Defaults to `local`. | Test `/api/upload`. |
| `MAX_FILE_SIZE_MB` | Number (`15`) | Optional | Optional | Maximum allowed file upload size. | Test file upload exceeding limit. |
| `SUPABASE_URL` | URL | No | Optional | Supabase Project URL for cloud uploads. | Upload study material. |
| `SUPABASE_ANON_KEY` | String | No | Optional | Supabase project API key. | Upload study material. |
| `SUPABASE_STORAGE_BUCKET`| String (`linktest-materials`) | No | Optional | Supabase storage bucket name. | Upload study material. |
| `LIVEKIT_SERVER_URL` | URL | No | Optional | LiveKit WebRTC server (e.g. `wss://linktest.livekit.cloud`). | Inspect `GET /api/livekit/status`. |
| `LIVEKIT_API_KEY` | String | No | Optional | LiveKit API Key from dashboard. | Inspect `GET /api/livekit/status`. |
| `LIVEKIT_API_SECRET` | String | No | Optional | LiveKit API Secret (kept server-side). | Call `POST /api/livekit/token`. |

---

## 2. Frontend Environment Variables (`frontend/.env`)

| Variable | Type / Default | Required Local | Required Online | Where to Obtain / Notes | How to Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL (`http://localhost:8081/api`) | Optional | **Yes** | Point to your deployed backend (e.g. `https://linktest-api.onrender.com/api`). | Check Network tab in browser dev tools. |
