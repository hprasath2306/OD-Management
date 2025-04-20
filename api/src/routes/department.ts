import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateResource } from '../middleware/validate.js';
import { departmentController } from '../controllers/department.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../types/department.js';

const router = Router();

// Create department - Only admin can create departments
router.post(
  '/',
   authMiddleware,
  authorize(['ADMIN']),
  validateResource(createDepartmentSchema),
  departmentController.createDepartment
);

// Get all departments - Accessible to authenticated users
router.get(
  '/',
  authMiddleware,
  departmentController.getAllDepartments
);

// Get department by ID - Accessible to authenticated users
router.get(
  '/:id',
  authMiddleware,
  departmentController.getDepartmentById
);

// Update department - Only admin can update departments
router.put(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(updateDepartmentSchema),
  departmentController.updateDepartment
);

// Delete department - Only admin can delete departments
router.delete(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  departmentController.deleteDepartment
);

export default router;