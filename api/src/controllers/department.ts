import { Request, Response } from "express";
import { departmentService } from "../services/department.js";

export class DepartmentController {
  // Create department
  async createDepartment(req: Request, res: Response) {
    try {
      const { name, code } = req.body;
      console.log(name, code);

      if (!name || !code) {
        res.status(400).json({
          success: false,
          message: "Name and code are required",
        });
        return;
      }

      // Check if department with code already exists
      const existingDepartment = await departmentService.getDepartmentByCode(
        code
      );
      if (existingDepartment) {
        res.status(400).json({
          success: false,
          message: "Department with this code already exists",
        });
        return;
      }

      const department = await departmentService.createDepartment({
        name,
        code,
      });
      res.status(201).json({
        success: true,
        data: department,
        message: "Department created successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
      });
      return;
    }
  }

  // Get all departments
  async getAllDepartments(req: Request, res: Response) {
    try {
      const departments = await departmentService.getAllDepartments();
      res.status(200).json({
        success: true,
        data: departments,
        message: "Departments retrieved successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving departments",
      });
      return;
    }
  }

  // Get department by ID
  async getDepartmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentById(id);

      if (!department) {
        res.status(404).json({
          success: false,
          message: "Department not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: department,
        message: "Department retrieved successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving department",
      });
      return;
    }
  }

  // Update department
  async updateDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code } = req.body;

      // Check if department exists
      const existingDepartment = await departmentService.getDepartmentById(id);
      if (!existingDepartment) {
        res.status(404).json({
          success: false,
          message: "Department not found",
        });
        return;
      }

      // If code is being updated, check if new code already exists
      if (code && code !== existingDepartment.code) {
        const departmentWithCode = await departmentService.getDepartmentByCode(
          code
        );
        if (departmentWithCode) {
          res.status(400).json({
            success: false,
            message: "Department with this code already exists",
          });
          return;
        }
      }

      const department = await departmentService.updateDepartment(id, {
        name,
        code,
      });
      res.status(200).json({
        success: true,
        data: department,
        message: "Department updated successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating department",
      });
      return;
    }
  }

  // Delete department
  async deleteDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if department exists
      const existingDepartment = await departmentService.getDepartmentById(id);
      if (!existingDepartment) {
        res.status(404).json({
          success: false,
          message: "Department not found",
        });
        return;
      }

      await departmentService.deleteDepartment(id);
      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting department",
      });
      return;
    }
  }
}

export const departmentController = new DepartmentController();
