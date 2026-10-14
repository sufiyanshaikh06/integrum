import { Router } from 'express';
import { contentController } from '../controllers/content.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  getAnnouncementsQuerySchema,
  getEventsQuerySchema,
  getResourcesQuerySchema,
} from '../schemas/content.schema.js';

const router = Router();

// Content feeds require authenticated user context (accessible to STUDENT and ADMIN)
router.use(authenticate);

// GET /api/v1/content/announcements — student scoped active announcements & notices
router.get('/announcements', validateRequest(getAnnouncementsQuerySchema), contentController.getAnnouncements);

// GET /api/v1/content/events — student scoped institutional events
router.get('/events', validateRequest(getEventsQuerySchema), contentController.getEvents);

// GET /api/v1/content/resources — student scoped academic resources
router.get('/resources', validateRequest(getResourcesQuerySchema), contentController.getResources);

export default router;
