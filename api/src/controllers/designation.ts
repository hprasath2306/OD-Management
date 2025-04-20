import { Request, Response } from "express";
import { designationService } from "../services/designation.js";
import { Role } from "@prisma/client";

export class DesignationController {
  // Create designation
  async createDesignation(req: Request, res: Response) {
    try {
      const { role, description } = req.body;

      if (!role) {
        res.status(400).json({
          success: false,
          message: "Role is required",
        });
        return;
      }

      // Check if designation with role already exists
      const existingDesignation = await designationService.getDesignationByRole(role);
      if (existingDesignation) {
        res.status(400).json({
          success: false,
          message: "Designation with this role already exists",
        });
        return;
      }

      const designation = await designationService.createDesignation({
        role,
        description,
      });
      res.status(201).json({
        success: true,
        data: designation,
        message: "Designation created successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating designation",
      });
      return;
    }
  }

  // Get all designations
  async getAllDesignations(req: Request, res: Response) {
    try {
      const designations = await designationService.getAllDesignations();
      res.status(200).json({
        success: true,
        data: designations,
        message: "Designations retrieved successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving designations",
      });
      return;
    }
  }

  // Get designation by ID
  async getDesignationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const designation = await designationService.getDesignationById(id);

      if (!designation) {
        res.status(404).json({
          success: false,
          message: "Designation not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: designation,
        message: "Designation retrieved successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving designation",
      });
      return;
    }
  }

  // Update designation
  async updateDesignation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, description } = req.body;

      // Check if designation exists
      const existingDesignation = await designationService.getDesignationById(id);
      if (!existingDesignation) {
        res.status(404).json({
          success: false,
          message: "Designation not found",
        });
        return;
      }

      // If role is being updated, check if new role already exists
      if (role && role !== existingDesignation.role) {
        const designationWithRole = await designationService.getDesignationByRole(role);
        if (designationWithRole) {
          res.status(400).json({
            success: false,
            message: "Designation with this role already exists",
          });
          return;
        }
      }

      const designation = await designationService.updateDesignation(id, {
        role,
        description,
      });
      res.status(200).json({
        success: true,
        data: designation,
        message: "Designation updated successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating designation",
      });
      return;
    }
  }

  // Delete designation
  async deleteDesignation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if designation exists
      const existingDesignation = await designationService.getDesignationById(id);
      if (!existingDesignation) {
        res.status(404).json({
          success: false,
          message: "Designation not found",
        });
        return;
      }

      await designationService.deleteDesignation(id);
      res.status(200).json({
        success: true,
        message: "Designation deleted successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting designation",
      });
      return;
    }
  }
}

export const designationController = new DesignationController();
