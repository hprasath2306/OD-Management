import { Router } from "express";
import { flowTemplateController } from "../controllers/flowTemplate";
import { validateResource } from "../middleware/validate";
import { createFlowTemplateSchema, updateFlowTemplateSchema } from "../types/flowTemplate";
import { authMiddleware } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { UserRole } from "@prisma/client";

const router = Router();

// Create a new flow template (Admin only)
router.post(
  "/",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  validateResource(createFlowTemplateSchema),
  flowTemplateController.createFlowTemplate
);

// Get all flow templates (Authenticated users)
router.get(
  "/",
  authMiddleware,
  flowTemplateController.getAllFlowTemplates
);

// Get flow template by ID (Authenticated users)
router.get(
  "/:id",
  authMiddleware,
  flowTemplateController.getFlowTemplateById
);

// Get flow template by name (Authenticated users)
router.get(
  "/name/:name",
  authMiddleware,
  flowTemplateController.getFlowTemplateByName
);

// Update flow template (Admin only)
router.put(
  "/:id",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  validateResource(updateFlowTemplateSchema),
  flowTemplateController.updateFlowTemplate
);

// Delete flow template (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  flowTemplateController.deleteFlowTemplate
);

export default router; 