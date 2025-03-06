import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateResource } from '../middleware/validate';
import { studentController } from '../controllers/student';
import { createStudentSchema, updateStudentSchema } from '../types/student';

const router = Router();

// Create student - Only admin can create students
router.post(
  '/',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(createStudentSchema),
  studentController.createStudent
);

// Get all students - Accessible to authenticated users
router.get(
  '/',
  authMiddleware,
  studentController.getAllStudents
);

// Get student by ID - Accessible to authenticated users
router.get(
  '/:id',
  authMiddleware,
  studentController.getStudentById
);

// Get student by registration number - Accessible to authenticated users
router.get(
  '/reg/:regNo',
  authMiddleware,
  studentController.getStudentByRegNo
);

// Get students by group - Accessible to authenticated users
router.get(
  '/group/:groupId',
  authMiddleware,
  studentController.getStudentsByGroup
);

// Update student - Only admin can update students
router.put(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(updateStudentSchema),
  studentController.updateStudent
);

// Delete student - Only admin can delete students
router.delete(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  studentController.deleteStudent
);

export default router; 