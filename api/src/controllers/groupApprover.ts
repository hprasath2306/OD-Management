import { Request, Response } from "express";
import { groupApproverService } from "../services/groupApprover.js";

export class GroupApproverController {
  // Create group approver
  async createGroupApprover(req: Request, res: Response) {
    try {
      const { groupId, teacherId, role } = req.body;
      
      const groupApprover = await groupApproverService.createGroupApprover({
        groupId,
        teacherId,
        role,
      });

      res.status(201).json({
        success: true,
        data: groupApprover,
        message: "Group approver created successfully",
      });
    } catch (error: any) {
      console.error("Error creating group approver:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error creating group approver",
      });
    }
  }

  // Get all group approvers
  async getAllGroupApprovers(req: Request, res: Response) {
    try {
      const groupApprovers = await groupApproverService.getAllGroupApprovers();
      res.status(200).json({
        success: true,
        data: groupApprovers,
        message: "Group approvers retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error retrieving group approvers:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving group approvers",
      });
    }
  }

  // Get group approver by ID
  async getGroupApproverById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const groupApprover = await groupApproverService.getGroupApproverById(id);

      if (!groupApprover) {
        res.status(404).json({
          success: false,
          message: "Group approver not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: groupApprover,
        message: "Group approver retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error retrieving group approver:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving group approver",
      });
    }
  }

  // Get group approvers by group
  async getGroupApproversByGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const groupApprovers = await groupApproverService.getGroupApproversByGroup(groupId);

      res.status(200).json({
        success: true,
        data: groupApprovers,
        message: "Group approvers retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error retrieving group approvers:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving group approvers",
      });
    }
  }

  // Get group approvers by teacher
  async getGroupApproversByTeacher(req: Request, res: Response) {
    try {
      const { teacherId } = req.params;
      const groupApprovers = await groupApproverService.getGroupApproversByTeacher(teacherId);

      res.status(200).json({
        success: true,
        data: groupApprovers,
        message: "Group approvers retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error retrieving group approvers:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error retrieving group approvers",
      });
    }
  }

  // Update group approver
  async updateGroupApprover(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { groupId, teacherId, role } = req.body;

      // Check if group approver exists
      const existingGroupApprover = await groupApproverService.getGroupApproverById(id);
      if (!existingGroupApprover) {
        res.status(404).json({
          success: false,
          message: "Group approver not found",
        });
        return;
      }

      const groupApprover = await groupApproverService.updateGroupApprover(id, {
        groupId,
        teacherId,
        role,
      });

      res.status(200).json({
        success: true,
        data: groupApprover,
        message: "Group approver updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating group approver:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error updating group approver",
      });
    }
  }

  // Delete group approver
  async deleteGroupApprover(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if group approver exists
      const existingGroupApprover = await groupApproverService.getGroupApproverById(id);
      if (!existingGroupApprover) {
        res.status(404).json({
          success: false,
          message: "Group approver not found",
        });
        return;
      }

      await groupApproverService.deleteGroupApprover(id);
      res.status(200).json({
        success: true,
        message: "Group approver deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting group approver:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error deleting group approver",
      });
    }
  }
}

export const groupApproverController = new GroupApproverController(); 