import { Request, Response } from "express";
import { teacherDesignationService } from "../services/teacherDesignation";

export class TeacherDesignationController {
  // Create a new teacher designation
  async createTeacherDesignation(req: Request, res: Response) {
    try {
      const teacherDesignation = await teacherDesignationService.createTeacherDesignation(req.body);
      return res.status(201).json(teacherDesignation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Get all teacher designations
  async getAllTeacherDesignations(req: Request, res: Response) {
    try {
      const teacherDesignations = await teacherDesignationService.getAllTeacherDesignations();
      return res.status(200).json(teacherDesignations);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Get teacher designation by ID
  async getTeacherDesignationById(req: Request, res: Response) {
    try {
      const teacherDesignation = await teacherDesignationService.getTeacherDesignationById(req.params.id);
      if (!teacherDesignation) {
        return res.status(404).json({ error: "Teacher designation not found" });
      }
      return res.status(200).json(teacherDesignation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Get teacher designations by teacher ID
  async getTeacherDesignationsByTeacherId(req: Request, res: Response) {
    try {
      const teacherDesignations = await teacherDesignationService.getTeacherDesignationsByTeacherId(req.params.teacherId);
      return res.status(200).json(teacherDesignations);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Get teacher designations by designation ID
  async getTeacherDesignationsByDesignationId(req: Request, res: Response) {
    try {
      const teacherDesignations = await teacherDesignationService.getTeacherDesignationsByDesignationId(req.params.designationId);
      return res.status(200).json(teacherDesignations);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Update teacher designation
  async updateTeacherDesignation(req: Request, res: Response) {
    try {
      const teacherDesignation = await teacherDesignationService.updateTeacherDesignation(
        req.params.id,
        req.body
      );
      return res.status(200).json(teacherDesignation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Delete teacher designation
  async deleteTeacherDesignation(req: Request, res: Response) {
    try {
      const teacherDesignation = await teacherDesignationService.deleteTeacherDesignation(req.params.id);
      return res.status(200).json(teacherDesignation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const teacherDesignationController = new TeacherDesignationController(); 