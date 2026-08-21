import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createCertificationSchema, updateCertificationSchema } from '../schemas/certification.schema.js';
import {
  createCertification,
  getCertifications,
  getCertificationById,
  updateCertification,
  deleteCertification,
  getExpiringCertifications,
} from '../controllers/certification.controller.js';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

router.get('/expiring', getExpiringCertifications); // P4: must be before /:id
router.post('/', validateRequest(createCertificationSchema), createCertification);
router.get('/', getCertifications);
router.get('/:id', getCertificationById);
router.patch('/:id', validateRequest(updateCertificationSchema), updateCertification);
router.delete('/:id', deleteCertification);

export default router;
