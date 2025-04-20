import { Router } from "express";
import { flowStepController } from "../controllers/flowStep.js";

import { createFlowStepSchema, updateFlowStepSchema } from "../types/flowStep.js";

import { authorize } from "../middleware/authorize.js";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.js";
import { validateResource } from "../middleware/validate.js";

const router = Router();

// Create a new flow step (Admin only)
router.post(
  "/",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  validateResource(createFlowStepSchema),
  flowStepController.createFlowStep
);

// Get all flow steps (Authenticated users)
router.get(
  "/",
  authMiddleware,
  flowStepController.getAllFlowSteps
);

// Get flow step by ID (Authenticated users)
router.get(
  "/:id",
  authMiddleware,
  flowStepController.getFlowStepById
);

// Get flow steps by template (Authenticated users)
router.get(
  "/template/:flowTemplateId",
  authMiddleware,
  flowStepController.getFlowStepsByTemplate
);

// Update flow step (Admin only)
router.put(
  "/:id",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  validateResource(updateFlowStepSchema),
  flowStepController.updateFlowStep
);

// Delete flow step (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  flowStepController.deleteFlowStep
);

export default router; 