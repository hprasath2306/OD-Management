import { Request, Response } from "express";
import { requestService } from "../services/request";
import { UserRole } from "@prisma/client";

export class RequestController {
  // Create a new request
  async createRequest(req: Request, res: Response) {
    try {
      console.log("sdfgdsf"+res.locals.user.id)
      const request = await requestService.createRequest({
        ...req.body,
        requestedById: res.locals.user.id, // From auth middleware
      });
      res.status(201).json(request); 
      return

    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return
    }
  }

  // Process an approval step
  async processApprovalStep(req: Request, res: Response) {
    try {
      // Check if user is a teacher
      if (res.locals.user.role !== UserRole.TEACHER) {
        res.status(403).json({ error: 'Only teachers can process approvals' });
        return;
      }

      const { id } = req.params;
      const { status, comments ,requestId} = req.body;

      const result = await requestService.processApprovalStep(id,  {
        status,
        comments,
        requestId
      });

      res.json(result);
    } catch (error: any) {
      console.error(`Error processing approval: ${error.message}`);
      res.status(error.message.includes('No pending step') ? 400 : 500).json({
        error: error.message || 'Failed to process approval',
      });
    }
  }

  // Get requests for approver
  async getApproverRequests(req: Request, res: Response) {
    try {
      // Check if user is a teacher
      if (res.locals.user.role !== UserRole.TEACHER) {
        res.status(403).json({ error: 'Only teachers can view requests' });
        return;
      }
    console.log("sdfgdsf"+res.locals.user.id)
      const requests = await requestService.getApproverRequests(res.locals.user.id);
      res.json({ requests });
    } catch (error: any) {
      console.error(`Error fetching approver requests: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  }

  // Get requests for student
  async getStudentRequests(req: Request, res: Response) {
    try {
      // Check if user is a student
      if (res.locals.user.role !== UserRole.STUDENT) {
        res.status(403).json({ error: 'Only students can view their requests' });
        return;
      }

      const requests = await requestService.getStudentRequests(res.locals.user.id);
      res.json({ requests });
    } catch (error: any) {
      console.error(`Error fetching student requests: ${error.message}`);
      res.status(error.message.includes('not a student') ? 403 : 500).json({
        error: error.message || 'Failed to fetch requests'
      });
    }
  }
}

export const requestController = new RequestController(); 