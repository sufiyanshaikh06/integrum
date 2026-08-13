import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAttendanceRecordSchema, updateAttendanceRecordSchema } from '../schemas/attendance.schema.js';
import {
  createAttendanceRecord,
  getAttendanceRecords,
  getAttendanceRecordById,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from '../controllers/attendance.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/', validate(createAttendanceRecordSchema), createAttendanceRecord);
router.get('/', getAttendanceRecords);
router.get('/:id', getAttendanceRecordById);
router.patch('/:id', validate(updateAttendanceRecordSchema), updateAttendanceRecord);
router.delete('/:id', deleteAttendanceRecord);

export default router;
