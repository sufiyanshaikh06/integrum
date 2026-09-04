import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest as validate } from '../middleware/validateRequest.js';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema.js';
import { noteUpload } from '../middleware/upload.js';
import { uploadLimiter } from '../config/limiters.js';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  uploadNoteFile,
  streamNoteFile,
} from '../controllers/note.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/', validate(createNoteSchema), createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.patch('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

router.post('/:noteId/upload', uploadLimiter, noteUpload.single('file'), uploadNoteFile);
router.get('/:noteId/file', streamNoteFile);

export default router;
