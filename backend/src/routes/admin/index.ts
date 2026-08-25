import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import userRoutes from './user.routes.js';
import academicRoutes from './academic.routes.js';
import contentRoutes from './content.routes.js';
import platformRoutes from './platform.routes.js';
import reportRoutes from './report.routes.js';

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

// User Management Subsystem
router.use('/users', userRoutes);

// Academic Catalog Subsystem
router.use('/academics', academicRoutes);

// Content Management Subsystem
router.use('/content', contentRoutes);

// Platform Management & Feedback Subsystem
router.use('/platform', platformRoutes);

// Reporting & Telemetry Subsystem
router.use('/reports', reportRoutes);

export default router;
