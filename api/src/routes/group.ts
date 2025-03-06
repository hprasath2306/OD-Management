import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateResource } from '../middleware/validate';
import { groupController } from '../controllers/group';
import { createGroupSchema, updateGroupSchema } from '../types/group';

const router = Router();

// Create group - Only admin can create groups
router.post(
  '/',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(createGroupSchema),
  groupController.createGroup
);

// Get all groups - Accessible to authenticated users
router.get(
  '/',
  authMiddleware,
  groupController.getAllGroups
);

// Get group by ID - Accessible to authenticated users
router.get(
  '/:id',
  authMiddleware,
  groupController.getGroupById
);

// Get groups by department - Accessible to authenticated users
router.get(
  '/department/:departmentId',
  authMiddleware,
  groupController.getGroupsByDepartment
);

// Update group - Only admin can update groups
router.put(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  validateResource(updateGroupSchema),
  groupController.updateGroup
);

// Delete group - Only admin can delete groups
router.delete(
  '/:id',
  authMiddleware,
  authorize(['ADMIN']),
  groupController.deleteGroup
);

export default router; 