import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDbStatus } from './db/index.js';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import quizRoutes from './routes/quizzes.js';
import progressRoutes from './routes/progress.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import teacherRoutes from './routes/teacher.js';
import studentRoutes from './routes/student.js';
import uploadRoutes from './routes/upload.js';
import livekitRoutes from './routes/livekit.js';
import mockTestRoutes from './routes/mockTests.js';
import batchRoutes from './routes/batches.js';
import studentsRoutes from './routes/students.js';
import questionBankRoutes from './routes/questionBank.js';
import subjectRoutes from './routes/subjects.js';

import crypto from 'crypto';

const app = express();

// Request ID tracking & structured request logging
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Security and utility middleware
app.use(helmet());

// Strictly allowed frontend origins (supporting dev ports 5173, 5174, 3000, and configured production URL)
const allowedOrigins = Array.from(new Set([
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean)));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (like server-to-server or tests without origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// Health and Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'operational',
      platform: 'LinkTest Node.js Express Backend',
      name: 'LinkTest API Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: getDbStatus(),
      ollama_configured_model: config.ollama.model,
      google_auth_configured: Boolean(config.google?.clientId),
      auth_methods: ['local_jwt', 'google_oauth2']
    },
    message: 'LinkTest Backend is running smoothly.'
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/livekit', livekitRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/questions', questionBankRoutes);
app.use('/api/subjects', subjectRoutes);

// Catch-all 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API route '${req.method} ${req.originalUrl}' does not exist.`
    }
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
