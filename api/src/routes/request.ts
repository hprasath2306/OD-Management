import { Router } from "express";

import { authorize } from "../middleware/authorize";
import { UserRole } from "@prisma/client";
import { createRequestSchema, processApprovalSchema } from "../types/request";
import { validateResource } from "../middleware/validate";
import { requestController } from "../controllers/request";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Create a new request (Students only)
router.post(
  "/",
  authMiddleware,
  authorize([UserRole.STUDENT]),
  validateResource(createRequestSchema),
  requestController.createRequest
);

// Process an approval step (Teachers only)
router.post(
  "/:id/approve",
  authMiddleware,
  authorize([UserRole.TEACHER]),
  validateResource(processApprovalSchema),
  requestController.processApprovalStep
);

// Get requests for approver (Teachers only)
router.get(
  "/approver",
  authMiddleware,
  authorize([UserRole.TEACHER]),
  requestController.getApproverRequests
);

// Get student's requests (Students only)
router.get(
  "/student",
  authMiddleware,
  authorize([UserRole.STUDENT]),
  requestController.getStudentRequests
);

router.get(
  "/",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  requestController.getAllRequests
);

router.get(
  "/group",
  authMiddleware,
  authorize([UserRole.TEACHER]),
  requestController.getGroupRequests
);


// Get all requests (Authenticated users)
// Can filter by studentId, groupId, and status using query params

export default router; 