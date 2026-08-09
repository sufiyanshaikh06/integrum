import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';

import { authorize } from '../middleware/authorize.js';

const router = Router();

// As per user specification, /me is moved to user resource
router.get('/me', authenticate, userController.getProfile);

// Dummy route for RBAC testing
router.get('/admin-only', authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

export default router;
