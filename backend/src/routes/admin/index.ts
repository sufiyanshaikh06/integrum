import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const router = Router();

// All admin routes strictly require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Base health/diagnostic check for Admin subsystem
router.get('/ping', (req, res) => {
  return ApiResponse.success(res, 'Admin portal foundation operational', {
    adminUserId: req.user!.id,
    adminEmail: req.user!.email,
    adminProfileId: req.user!.adminProfile?.id,
    permissionsLevel: req.user!.adminProfile?.permissionsLevel,
    timestamp: new Date().toISOString(),
  });
});

export default router;
