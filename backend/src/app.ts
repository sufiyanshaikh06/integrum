import path from 'path';
import fs from 'fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { uploadLimiter } from './config/limiters.js';

export { uploadLimiter };

// Route imports
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import taskRoutes from './routes/task.routes.js';
import reminderRoutes from './routes/reminder.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import studyPlanRoutes from './routes/studyplan.routes.js';
import noteRoutes from './routes/note.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import skillRoutes from './routes/skill.routes.js';
import jobApplicationRoutes from './routes/jobapplication.routes.js';
import certificationRoutes from './routes/certification.routes.js';
import projectRoutes from './routes/project.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin/index.js';
import catalogRoutes from './routes/catalog.routes.js';
import contentRoutes from './routes/content.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';

import { maintenanceMode } from './middleware/maintenanceMode.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

app.set('trust proxy', env.TRUST_PROXY_HOPS);

// Security headers
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiting (production only — avoid disrupting dev/test workflows)
if (env.NODE_ENV === 'production') {
  app.use(globalLimiter);

  // Auth-specific rate limits
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/forgot-password', authLimiter);
  app.use('/api/v1/auth/reset-password', authLimiter);
}

// Body parsing with limits
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Maintenance Mode Enforcement (bypasses /health, /admin, login/refresh, and admin tokens)
app.use(maintenanceMode);

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/semesters', semesterRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/study-plans', studyPlanRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/job-applications', jobApplicationRoutes);
app.use('/api/v1/certifications', certificationRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin', adminRoutes);

// Serve frontend production build if available
const frontendDist = path.resolve(process.cwd(), '../frontend/dist');
const altFrontendDist = path.resolve(process.cwd(), 'frontend/dist');
const targetDist = fs.existsSync(frontendDist) ? frontendDist : (fs.existsSync(altFrontendDist) ? altFrontendDist : null);

if (targetDist) {
  app.use(express.static(targetDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(targetDist, 'index.html'));
  });
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
