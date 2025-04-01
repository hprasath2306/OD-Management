import { Router } from "express";
import { labController } from "../controllers/lab.js";
import { createLabSchema, updateLabSchema } from "../types/lab.js";
import { authorize } from "../middleware/authorize.js";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.js";
import { validateResource } from "../middleware/validate.js";
const router = Router();
// Create a new lab (Admin only)
router.post("/", authMiddleware, authorize([UserRole.ADMIN]), validateResource(createLabSchema), labController.createLab);
// Get all labs (Authenticated users)
router.get("/", authMiddleware, labController.getAllLabs);
// Get lab by ID (Authenticated users)
router.get("/:id", authMiddleware, labController.getLabById);
// Get labs by department (Authenticated users)
router.get("/department/:departmentId", authMiddleware, labController.getLabsByDepartment);
// Get labs by incharge (Authenticated users)
router.get("/incharge/:inchargeId", authMiddleware, labController.getLabsByIncharge);
// Update lab (Admin only)
router.put("/:id", authMiddleware, authorize([UserRole.ADMIN]), validateResource(updateLabSchema), labController.updateLab);
// Delete lab (Admin only)
router.delete("/:id", authMiddleware, authorize([UserRole.ADMIN]), labController.deleteLab);
export default router;
