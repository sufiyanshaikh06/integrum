import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest as validate } from '../middleware/validateRequest.js';
import { createAttendanceRecordSchema, updateAttendanceRecordSchema } from '../schemas/attendance.schema.js';
import {
  createAttendanceRecord,
  getAttendanceRecords,
  getAttendanceRecordById,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceReport,
} from '../controllers/attendance.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/', validate(createAttendanceRecordSchema), createAttendanceRecord);
router.get('/', getAttendanceRecords);
router.get('/report', getAttendanceReport); // A-4: must be before /:id
router.get('/:id', getAttendanceRecordById);
router.patch('/:id', validate(updateAttendanceRecordSchema), updateAttendanceRecord);
router.delete('/:id', deleteAttendanceRecord);

export default router;
