import { Request, Response } from "express";
import { teacherDesignationService } from "../services/teacherDesignation";

export class TeacherDesignationController {
  // Create a new teacher designation
  async createTeacherDesignation(req: Request, res: Response) {
    try {
      console.log(req.body);
      const teacherDesignation = await teacherDesignationService.createTeacherDesignation(req.body);
      res.status(201).json(teacherDesignation);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // Get all teacher designations
  async getAllTeacherDesignations(req: Request, res: Response) {
    try {
      const teacherDesignations = await teacherDesignationService.getAllTeacherDesignations();
      res.status(200).json(teacherDesignations);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // Get teacher designation by ID
  async getTeacherDesignationById(req: Request, res: Response) {
    try {
      const teacherDesignation = await teacherDesignationService.getTeacherDesignationById(req.params.id);
      if (!teacherDesignation) {
        res.status(404).json({ error: "Teacher designation not found" });
        return;
      }
      res.status(200).json(teacherDesignation);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // Get teacher designations by teacher ID
  async getTeacherDesignationsByTeacherId(req: Request, res: Response) {
    try {
      const teacherDesignations = await teacherDesignationService.getTeacherDesignationsByTeacherId(req.params.teacherId);
      res.status(200).json(teacherDesignations);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // Get teacher designations by designation ID
  async getTeacherDesignationsByDesignationId(req: Request, res: Response) {
    try {
      const teacherDesignations = await teacherDesignationService.getTeacherDesignationsByDesignationId(req.params.designationId);
      res.status(200).json(teacherDesignations);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // Update teacher designation
  async updateTeacherDesignation(req: Request, res: Response) {
    try {
      const teacherDesignation = await teacherDesignationService.updateTeacherDesignation(
        req.params.id,
        req.body
      );
      res.status(200).json(teacherDesignation);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // Delete teacher designation
  async deleteTeacherDesignation(req: Request, res: Response) {
    try {
      const teacherDesignation = await teacherDesignationService.deleteTeacherDesignation(req.params.id);
      res.status(200).json(teacherDesignation);
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }
}

export const teacherDesignationController = new TeacherDesignationController(); 