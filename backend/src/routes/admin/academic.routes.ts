import { Router } from 'express';
import { adminAcademicController } from '../../controllers/admin/academic.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentsQuerySchema,
  createCourseSchema,
  updateCourseSchema,
  listCoursesQuerySchema,
  createMasterSubjectSchema,
  updateMasterSubjectSchema,
  listMasterSubjectsQuerySchema,
  createAcademicTermSchema,
  updateAcademicTermSchema,
  listAcademicTermsQuerySchema,
  createRegistrationCodeSchema,
  updateRegistrationCodeSchema,
  listRegistrationCodesQuerySchema,
} from '../../schemas/admin/academic.schema.js';

const router = Router();

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
router.post('/departments', validateRequest(createDepartmentSchema), adminAcademicController.createDepartment);
router.get('/departments', validateRequest(listDepartmentsQuerySchema), adminAcademicController.listDepartments);
router.get('/departments/:id', adminAcademicController.getDepartmentById);
router.patch('/departments/:id', validateRequest(updateDepartmentSchema), adminAcademicController.updateDepartment);
router.delete('/departments/:id', adminAcademicController.deleteDepartment);

// ─── COURSES ─────────────────────────────────────────────────────────────────
router.post('/courses', validateRequest(createCourseSchema), adminAcademicController.createCourse);
router.get('/courses', validateRequest(listCoursesQuerySchema), adminAcademicController.listCourses);
router.get('/courses/:id', adminAcademicController.getCourseById);
router.patch('/courses/:id', validateRequest(updateCourseSchema), adminAcademicController.updateCourse);
router.delete('/courses/:id', adminAcademicController.deleteCourse);

// ─── MASTER SUBJECTS ─────────────────────────────────────────────────────────
router.post('/master-subjects', validateRequest(createMasterSubjectSchema), adminAcademicController.createMasterSubject);
router.get('/master-subjects', validateRequest(listMasterSubjectsQuerySchema), adminAcademicController.listMasterSubjects);
router.get('/master-subjects/:id', adminAcademicController.getMasterSubjectById);
router.patch('/master-subjects/:id', validateRequest(updateMasterSubjectSchema), adminAcademicController.updateMasterSubject);
router.delete('/master-subjects/:id', adminAcademicController.deleteMasterSubject);

// ─── ACADEMIC TERMS ──────────────────────────────────────────────────────────
router.post('/terms', validateRequest(createAcademicTermSchema), adminAcademicController.createAcademicTerm);
router.get('/terms', validateRequest(listAcademicTermsQuerySchema), adminAcademicController.listAcademicTerms);
router.get('/terms/:id', adminAcademicController.getAcademicTermById);
router.patch('/terms/:id', validateRequest(updateAcademicTermSchema), adminAcademicController.updateAcademicTerm);
router.delete('/terms/:id', adminAcademicController.deleteAcademicTerm);

// ─── REGISTRATION CODES ───────────────────────────────────────────────────
router.post('/registration-codes', validateRequest(createRegistrationCodeSchema), adminAcademicController.createRegistrationCode);
router.get('/registration-codes', validateRequest(listRegistrationCodesQuerySchema), adminAcademicController.listRegistrationCodes);
router.patch('/registration-codes/:id', validateRequest(updateRegistrationCodeSchema), adminAcademicController.updateRegistrationCode);
router.patch('/registration-codes/:id/toggle', adminAcademicController.toggleRegistrationCode);

export default router;
