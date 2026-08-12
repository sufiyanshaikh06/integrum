import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
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
router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/', validate(createReminderSchema), createReminder);
router.get('/', getReminders);
router.get('/:id', getReminderById);
router.patch('/:id', validate(updateReminderSchema), updateReminder);
router.delete('/:id', deleteReminder);

export default router;
