import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateResource } from '../middleware/validate.js';
import { groupApproverController } from '../controllers/groupApprover.js';
import { createGroupApproverSchema, updateGroupApproverSchema } from '../types/groupApprover.js';
const router = Router();
// Create group approver - Only admin can create group approvers
router.post('/', authMiddleware, authorize(['ADMIN']), validateResource(createGroupApproverSchema), groupApproverController.createGroupApprover);
// Get all group approvers - Accessible to authenticated users
router.get('/', authMiddleware, groupApproverController.getAllGroupApprovers);
// Get group approver by ID - Accessible to authenticated users
router.get('/:id', authMiddleware, groupApproverController.getGroupApproverById);
// Get group approvers by group - Accessible to authenticated users
router.get('/group/:groupId', authMiddleware, groupApproverController.getGroupApproversByGroup);
// Get group approvers by teacher - Accessible to authenticated users
router.get('/teacher/:teacherId', authMiddleware, groupApproverController.getGroupApproversByTeacher);
// Update group approver - Only admin can update group approvers
router.put('/:id', authMiddleware, authorize(['ADMIN']), validateResource(updateGroupApproverSchema), groupApproverController.updateGroupApprover);
// Delete group approver - Only admin can delete group approvers
router.delete('/:id', authMiddleware, authorize(['ADMIN']), groupApproverController.deleteGroupApprover);
export default router;
