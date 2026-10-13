# LinkTest LMS — Online Production Deployment Guide

This guide details how to deploy the LinkTest platform to modern, production-grade cloud infrastructure (Vercel, Render/Railway, Neon PostgreSQL).

---

## 1. Production Architecture Overview

```
                      ┌────────────────────────────┐
                      │    Client Browser / PWA    │
                      └─────────────┬──────────────┘
                                    │ HTTPS
                                    ▼
                      ┌────────────────────────────┐
                      │  Frontend (Vercel Edge)    │
                      │  SPA build via Vite        │
                      └─────────────┬──────────────┘
                                    │ REST APIs / HTTPS
                                    ▼
                      ┌────────────────────────────┐
                      │ Backend (Render / Railway) │
                      │ Express.js (Node.js 20)    │
                      └──────┬───────┬───────┬─────┘
                             │       │       │
              ┌──────────────┘       │       └──────────────┐
              ▼                      ▼                      ▼
  ┌──────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐
  │ Managed PostgreSQL   │ │ Gmail SMTP        │ │ Cloud AI / Groq      │
  │ (Neon Serverless DB) │ │ Nodemailer / TLS  │ │ Llama-3.1-8b API     │
  └──────────────────────┘ └───────────────────┘ └──────────────────────┘
```

---

## 2. Step 1: Database Setup (Neon PostgreSQL)

1. Sign up for a free serverless PostgreSQL instance at [https://neon.tech](https://neon.tech).
2. Create a project named `linktest-prod`.
3. Copy the pooled connection string (with SSL mode enabled):
   ```
   postgresql://neondb_owner:YOUR_KEY@ep-cool-base-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Run migrations from your machine against the cloud database:
   ```powershell
   $env:DATABASE_URL="postgresql://neondb_owner:YOUR_KEY@ep-cool-base-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   cd c:\Users\abhis\linktest\backend
   npm run db:migrate
   npm run db:seed
   ```

---

## 3. Step 2: Backend Deployment (Render or Railway)

### Option A: Render Blueprint (Recommended)
1. Fork or push the LinkTest repository to your GitHub account.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your repository. Render will automatically detect `render.yaml` at the root.
5. Provide the required production environment variables:
   - `DATABASE_URL`: Your Neon connection string.
   - `JWT_SECRET`: A secure 64-character random string.
   - `FRONTEND_URL`: `https://your-app.vercel.app` (or custom domain).
   - `SMTP_USER`: Your Gmail address.
   - `SMTP_APP_PASSWORD`: Your 16-character Google App Password.
   - `CLOUD_AI_API_KEY`: Your Groq or OpenAI API key.
   - `CLOUD_AI_MODEL`: `llama-3.1-8b-instant` (or `gpt-4o-mini`).
6. Deploy the service. Note the allocated URL (e.g., `https://linktest-api.onrender.com`).

---

## 4. Step 3: Frontend Deployment (Vercel)

1. Log into [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Configure Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://linktest-api.onrender.com/api`
6. Click **Deploy**.
7. Vercel automatically respects `frontend/vercel.json` for SPA routing and security headers.

---

## 5. Step 4: Verification & Smoke Testing

1. **Verify Backend Health:**
   ```bash
   curl https://linktest-api.onrender.com/api/health
   ```
   Confirm `database.isPostgres: true` and `status: "operational"`.

2. **Verify Video & AI Status:**
   ```bash
   curl https://linktest-api.onrender.com/api/livekit/status
   curl https://linktest-api.onrender.com/api/ai/status
   ```

3. **Verify Frontend UI:**
   - Navigate to `https://your-app.vercel.app`.
   - Log in with `admin@linktest.io`, `teacher@linktest.io`, and `student@linktest.io`.
   - Test a quiz submission and verify persistence.
