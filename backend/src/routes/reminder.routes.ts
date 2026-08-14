import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createReminderSchema, updateReminderSchema } from '../schemas/reminder.schema.js';
import {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} from '../controllers/reminder.controller.js';

const router = Router();

// All reminder routes require authentication and STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createReminderSchema), createReminder);
router.get('/', getReminders);
router.get('/:id', getReminderById);
router.patch('/:id', validateRequest(updateReminderSchema), updateReminder);
router.delete('/:id', deleteReminder);

export default router;
