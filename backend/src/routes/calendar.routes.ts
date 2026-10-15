import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest as validate } from '../middleware/validateRequest.js';
import { createCalendarEventSchema, updateCalendarEventSchema, getUnifiedCalendarSchema } from '../schemas/calendar.schema.js';
import {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUnifiedCalendar,
} from '../controllers/calendar.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

// W05: Unified Calendar Endpoint
router.get('/unified', validate(getUnifiedCalendarSchema), getUnifiedCalendar);

router.post('/', validate(createCalendarEventSchema), createCalendarEvent);
router.get('/', getCalendarEvents);
router.get('/:id', getCalendarEventById);
router.patch('/:id', validate(updateCalendarEventSchema), updateCalendarEvent);
router.delete('/:id', deleteCalendarEvent);

export default router;
