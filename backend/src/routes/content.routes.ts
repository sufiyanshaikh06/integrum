import { Router } from 'express';
import { contentController } from '../controllers/content.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Content feeds require authenticated user context (accessible to STUDENT and ADMIN)
router.use(authenticate);

// GET /api/v1/content/announcements — student scoped active announcements & notices
router.get('/announcements', contentController.getAnnouncements);

// GET /api/v1/content/events — student scoped institutional events
router.get('/events', contentController.getEvents);

// GET /api/v1/content/resources — student scoped academic resources
router.get('/resources', contentController.getResources);

export default router;
