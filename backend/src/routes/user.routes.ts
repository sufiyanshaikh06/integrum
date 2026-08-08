import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// As per user specification, /me is moved to user resource
router.get('/me', authenticate, userController.getProfile);

export default router;
