import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8081', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/linktest',
  jwtSecret: process.env.JWT_SECRET || 'linktest_dev_jwt_secret_key_892348729384',
  jwtExpiresIn: '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'qwen3:8b',
    timeoutMs: 45000
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_APP_PASSWORD || '',
    fromName: process.env.SMTP_FROM_NAME || 'LinkTest',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@linktest.io'
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10),
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'linktest-materials'
  },
  livekit: {
    serverUrl: process.env.LIVEKIT_URL || process.env.LIVEKIT_SERVER_URL || '',
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || ''
  },
  cloudAi: {
    provider: process.env.CLOUD_AI_PROVIDER || '', // 'groq' | 'openai' | ''
    apiKey: process.env.CLOUD_AI_API_KEY || '',
    baseUrl: process.env.CLOUD_AI_BASE_URL || '',
    model: process.env.CLOUD_AI_MODEL || 'llama-3.1-8b-instant'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || ''
  }
};

