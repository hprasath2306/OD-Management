import { Router } from "express";

import { authorize } from "../middleware/authorize.js";
import { UserRole } from "@prisma/client";
import { createRequestSchema, processApprovalSchema } from "../types/request.js";
import { validateResource } from "../middleware/validate.js";
import { requestController } from "../controllers/request.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Create a new request
router.post('/', authMiddleware, requestController.createRequest.bind(requestController));

// Process an approval step
router.post('/:id/approve', authMiddleware, requestController.processApprovalStep.bind(requestController));

// Get requests for approver
router.get('/approver', authMiddleware, requestController.getApproverRequests.bind(requestController));

// Get requests for student
router.get('/student', authMiddleware, requestController.getStudentRequests.bind(requestController));

// Get requests for a group (filtered by role)
router.get('/group', authMiddleware, requestController.getGroupRequests.bind(requestController));

// Get all requests (admin only)
router.get('/', authMiddleware, requestController.getAllRequests.bind(requestController));

// Get request details specifically for approvals (includes proof document)
router.get('/:id/detail', authMiddleware, requestController.getRequestDetailById.bind(requestController));

// Get all requests (Authenticated users)
// Can filter by studentId, groupId, and status using query params

export default router; 