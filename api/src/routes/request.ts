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
  authorize([UserRole.ADMIN]),
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

// Get all requests (Authenticated users)
// Can filter by studentId, groupId, and status using query params

export default router; 