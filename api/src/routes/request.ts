import { Router } from "express";



import { authorize } from "../middleware/authorize";
import { UserRole } from "@prisma/client";
import { createRequestSchema } from "../types/request";
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

// Get all requests (Authenticated users)
// Can filter by studentId, groupId, and status using query params


export default router; 