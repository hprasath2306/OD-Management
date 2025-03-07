import { Router } from "express";
import { labController } from "../controllers/lab";

import { createLabSchema, updateLabSchema } from "../types/lab";
import { authorize } from "../middleware/authorize";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { validateResource } from "../middleware/validate";

const router = Router();

// Create a new lab (Admin only)
router.post(
  "/",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  validateResource(createLabSchema),
  labController.createLab
);

// Get all labs (Authenticated users)
router.get(
  "/",
  authMiddleware,
  labController.getAllLabs
);

// Get lab by ID (Authenticated users)
router.get(
  "/:id",
  authMiddleware,
  labController.getLabById
);

// Get labs by department (Authenticated users)
router.get(
  "/department/:departmentId",
  authMiddleware,
  labController.getLabsByDepartment
);

// Get labs by incharge (Authenticated users)
router.get(
  "/incharge/:inchargeId",
  authMiddleware,
  labController.getLabsByIncharge
);

// Update lab (Admin only)
router.put(
  "/:id",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  validateResource(updateLabSchema),
  labController.updateLab
);

// Delete lab (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  authorize([UserRole.ADMIN]),
  labController.deleteLab
);

export default router; 