import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateResource } from '../middleware/validate';
import { designationController } from '../controllers/designation';
import { createDesignationSchema, updateDesignationSchema } from '../types/designation';

const router = Router();

// Create designation - Only admin can create designations
router.post(
  '/',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(createDesignationSchema),
  designationController.createDesignation
);

// Get all designations - Accessible to authenticated users
router.get(
  '/',
  authMiddleware,
  designationController.getAllDesignations
);

// Get designation by ID - Accessible to authenticated users
router.get(
  '/:id',
  authMiddleware,
  designationController.getDesignationById
);

// Update designation - Only admin can update designations
router.put(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(updateDesignationSchema),
  designationController.updateDesignation
);

// Delete designation - Only admin can delete designations
router.delete(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  designationController.deleteDesignation
);

export default router;
