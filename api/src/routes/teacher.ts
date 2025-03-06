import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateResource } from '../middleware/validate';
import { teacherController } from '../controllers/teacher';
import { createTeacherSchema } from '../types/teacher';

const router = Router();

// Create teacher - Only admin can create teachers
router.post(
  '/',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(createTeacherSchema),
  teacherController.createTeacher
);

// Get all teachers - Accessible to authenticated users
router.get(
  '/',
  authMiddleware,
  teacherController.getAllTeachers
);

// Get teacher by ID - Accessible to authenticated users
router.get(
  '/:id',
  authMiddleware,
  teacherController.getTeacherById
);

export default router; 