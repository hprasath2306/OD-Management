import { Router } from "express";
import { teacherDesignationController } from "../controllers/teacherDesignation.js";
import { validateResource } from "../middleware/validate.js";
import { createTeacherDesignationSchema, updateTeacherDesignationSchema } from "../types/teacherDesignation.js";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { UserRole } from "@prisma/client";
const router = Router();
// Create a new teacher designation (Admin only)
router.post("/", authMiddleware, authorize([UserRole.ADMIN]), validateResource(createTeacherDesignationSchema), teacherDesignationController.createTeacherDesignation);
// Get all teacher designations (Authenticated users) 
router.get("/", authMiddleware, teacherDesignationController.getAllTeacherDesignations);
// Get teacher designation by ID (Authenticated users)
router.get("/:id", authMiddleware, teacherDesignationController.getTeacherDesignationById);
// Get teacher designations by teacher ID (Authenticated users)
router.get("/teacher/:teacherId", authMiddleware, teacherDesignationController.getTeacherDesignationsByTeacherId);
// Get teacher designations by designation ID (Authenticated users)
router.get("/designation/:designationId", authMiddleware, teacherDesignationController.getTeacherDesignationsByDesignationId);
// Update teacher designation (Admin only)
router.put("/:id", authMiddleware, authorize([UserRole.ADMIN]), validateResource(updateTeacherDesignationSchema), teacherDesignationController.updateTeacherDesignation);
// Delete teacher designation (Admin only)
router.delete("/:id", authMiddleware, authorize([UserRole.ADMIN]), teacherDesignationController.deleteTeacherDesignation);
export default router;
