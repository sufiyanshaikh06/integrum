import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import taskRoutes from './routes/task.routes.js';
import reminderRoutes from './routes/reminder.routes.js';
import studyPlanRoutes from './routes/studyplan.routes.js';
import noteRoutes from './routes/note.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import skillRoutes from './routes/skill.routes.js';
import jobApplicationRoutes from './routes/jobapplication.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/semesters', semesterRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/study-plans', studyPlanRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/job-applications', jobApplicationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
