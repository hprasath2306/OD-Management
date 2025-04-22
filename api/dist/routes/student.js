import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateResource } from '../middleware/validate.js';
import { studentController } from '../controllers/student.js';
import { createStudentSchema, updateStudentSchema } from '../types/student.js';
const router = Router();
// Create student - Only admin can create students
router.post('/', authMiddleware, authorize(['ADMIN']), validateResource(createStudentSchema), studentController.createStudent);
// Bulk create students - Only admin can create students
router.post('/bulk', authMiddleware, authorize(['ADMIN']), studentController.bulkCreateStudents);
// Get all students - Accessible to authenticated users
router.get('/', authMiddleware, studentController.getAllStudents);
// Get student by ID - Accessible to authenticated users
router.get('/:id', authMiddleware, studentController.getStudentById);
// Get student by registration number - Accessible to authenticated users
router.get('/reg/:regNo', authMiddleware, studentController.getStudentByRegNo);
// Get students by group - Accessible to authenticated users
router.get('/group/:groupId', authMiddleware, studentController.getStudentsByGroup);
// Update student - Only admin can update students
router.put('/:id', authMiddleware, authorize(['ADMIN']), validateResource(updateStudentSchema), studentController.updateStudent);
// Reset student's OD count - Only admins and teachers can reset OD counts
router.post('/:id/reset-od-count', authMiddleware, authorize(['ADMIN', 'TEACHER']), studentController.resetStudentODCount);
// Reset OD counts for all students in a group - Only admins and teachers can reset group OD counts
router.post('/group/:groupId/reset-od-counts', authMiddleware, authorize(['ADMIN', 'TEACHER']), studentController.resetGroupODCounts);
// Delete student - Only admin can delete students
router.delete('/:id', authMiddleware, authorize(['ADMIN']), studentController.deleteStudent);
export default router;
