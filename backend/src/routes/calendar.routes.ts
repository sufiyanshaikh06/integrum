import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCalendarEventSchema, updateCalendarEventSchema } from '../schemas/calendar.schema.js';
import {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendar.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/', validate(createCalendarEventSchema), createCalendarEvent);
router.get('/', getCalendarEvents);
router.get('/:id', getCalendarEventById);
router.patch('/:id', validate(updateCalendarEventSchema), updateCalendarEvent);
router.delete('/:id', deleteCalendarEvent);

export default router;
