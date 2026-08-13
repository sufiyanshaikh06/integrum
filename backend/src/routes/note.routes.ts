import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema.js';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/note.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/', validate(createNoteSchema), createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.patch('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

export default router;
