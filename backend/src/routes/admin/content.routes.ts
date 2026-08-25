import { Router } from 'express';
import { adminContentController } from '../../controllers/admin/content.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  listAnnouncementsQuerySchema,
  createInstitutionalEventSchema,
  updateInstitutionalEventSchema,
  listInstitutionalEventsQuerySchema,
  createAcademicResourceSchema,
  updateAcademicResourceSchema,
  listAcademicResourcesQuerySchema,
} from '../../schemas/admin/content.schema.js';

const router = Router();

// ─── ANNOUNCEMENTS / NOTICES ────────────────────────────────────────────────
router.post('/announcements', validateRequest(createAnnouncementSchema), adminContentController.createAnnouncement);
router.get('/announcements', validateRequest(listAnnouncementsQuerySchema), adminContentController.listAnnouncements);
router.get('/announcements/:id', adminContentController.getAnnouncementById);
router.patch('/announcements/:id', validateRequest(updateAnnouncementSchema), adminContentController.updateAnnouncement);
router.patch('/announcements/:id/publish', adminContentController.publishAnnouncement);
router.patch('/announcements/:id/unpublish', adminContentController.unpublishAnnouncement);
router.delete('/announcements/:id', adminContentController.deleteAnnouncement);

// ─── INSTITUTIONAL EVENTS ───────────────────────────────────────────────────
router.post('/events', validateRequest(createInstitutionalEventSchema), adminContentController.createEvent);
router.get('/events', validateRequest(listInstitutionalEventsQuerySchema), adminContentController.listEvents);
router.get('/events/:id', adminContentController.getEventById);
router.patch('/events/:id', validateRequest(updateInstitutionalEventSchema), adminContentController.updateEvent);
router.delete('/events/:id', adminContentController.deleteEvent);

// ─── ACADEMIC RESOURCES ─────────────────────────────────────────────────────
router.post('/resources', validateRequest(createAcademicResourceSchema), adminContentController.createResource);
router.get('/resources', validateRequest(listAcademicResourcesQuerySchema), adminContentController.listResources);
router.get('/resources/:id', adminContentController.getResourceById);
router.patch('/resources/:id', validateRequest(updateAcademicResourceSchema), adminContentController.updateResource);
router.delete('/resources/:id', adminContentController.deleteResource);

export default router;
