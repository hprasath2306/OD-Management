import { Request, Response } from "express";
import { requestService, notificationService } from "../services/index.js";
import prisma from "../db/config.js";
import { UserRole, ApprovalStatus } from "@prisma/client";

export class RequestController {
  // Create a new request
  async createRequest(req: Request, res: Response) {
    try {
      const requestData = {
        ...req.body,
        requestedById: res.locals.user.id,
      };

      const request = await requestService.createRequest(requestData);
      
      // Send notification to initial approvers
      await notificationService.notifyNewRequest(request.id);
      
      res.status(201).json({ request });
    } catch (error: any) {
      console.error(`Error creating request: ${error.message}`);
      res.status(400).json({
        error: error.message || 'Failed to create request',
      });
    }
  }

  async getGroupRequests(req: Request, res: Response) { 
    try {
      const requests = await requestService.getGroupRequests(res.locals.user.id);

      res.json({ requests });
    } catch (error: any) {
      console.error(`Error fetching grouped requests: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch requests' });
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
      const { status, comments, requestId } = req.body;

      const result = await requestService.processApprovalStep(id, {
        status,
        comments,
        requestId
      });

      // Send notifications based on the approval status
      if (status === ApprovalStatus.APPROVED || status === ApprovalStatus.REJECTED) {
        // Get the approval step that was just processed
        const approvalStep = await prisma.approvalStep.findFirst({
          where: {
            userId: id,
            approval: { requestId },
            status
          }
        });

        if (approvalStep) {
          await notificationService.notifyRequestStatus(
            requestId, 
            approvalStep.id, 
            status === ApprovalStatus.APPROVED
          );
        }
      }

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
      const requests = await requestService.getApproverRequests(res.locals.user.id);
      res.json({ requests });
    } catch (error: any) {
      console.error(`Error fetching approver requests: ${error.message}`);
      res.status(500).json({
        error: error.message || 'Failed to fetch approver requests',
      });
    }
  }

  // Get requests for the authenticated student
  async getStudentRequests(req: any, res: Response) {
    try {
      const userId = res.locals.user.id;
      
      // Get the student with their OD count
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { numberOfOD: true }
      });
      
      // Get the requests
      const requests = await requestService.getStudentRequests(userId);
      
      res.json({
        requests,
        odStats: {
          used: student?.numberOfOD || 0,
          remaining: Math.max(0, 10 - (student?.numberOfOD || 0)),
          maximum: 10
        }
      });
    } catch (error: any) {
      console.error(`Error fetching student requests: ${error.message}`);
      res.status(500).json({
        error: error.message || 'Failed to fetch student requests',
      });
    }
  }

  // Get all requests (admin only)
  async getAllRequests(req: Request, res: Response) {
    try {
      const requests = await requestService.getAllRequests();
      res.json({ requests });
    } catch (error: any) {
      console.error(`Error fetching all requests: ${error.message}`);
      res.status(500).json({
        error: error.message || 'Failed to fetch all requests',
      });
    }
  }

  // Get request details with previous steps for approval view
  async getRequestDetailById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      console.log(`Fetching detailed request with ID: ${id}`);
      
      const request = await prisma.request.findUnique({
        where: { id },
        include: {
          students: {
            include: {
              student: {
                include: { user: true, group: true },
              },
            },
          },
          lab: true,
          requestedBy: true,
          FlowTemplate: {
            include: { steps: true },
          },
          Approvals: {
            include: {
              approvalSteps: {
                include: {
                  User: true
                },
                orderBy: {
                  sequence: 'asc'
                }
              },
              group: true,
            },
          },
        },
      });

      if (!request) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      // Find the specific approval where the current user is an approver
      const userApprovalStep = res.locals.user.role === UserRole.TEACHER
        ? request.Approvals.flatMap(a => a.approvalSteps).find(
            step => step.userId === res.locals.user.id && step.status === ApprovalStatus.PENDING
          )
        : null;

      const approverGroupId = userApprovalStep?.groupId;
      
      // Find the approval that contains this step
      let approval = null;
      if (userApprovalStep) {
        approval = request.Approvals.find(a => 
          a.approvalSteps.some(step => step.id === userApprovalStep.id)
        );
      }

      // Prepare the response
      const responseObj = {
        id: request.id,
        type: request.type,
        category: request.category,
        needsLab: request.needsLab,
        reason: request.reason,
        description: request.description,
        startDate: request.startDate,
        endDate: request.endDate,
        status: request.status,
        lab: request.lab,
        requestedBy: request.requestedBy,
        proofOfOD: request.proofOfOD,
        // Filter students to only those in the approver's group if applicable
        students: approverGroupId 
          ? request.students.filter(s => s.student.groupId === approverGroupId)
          : request.students,
        flowTemplate: request.FlowTemplate,
        // Include only the relevant approval for this approver if applicable
        approvals: approval 
          ? [approval] 
          : request.Approvals,
        userApprovalStep,
      };

      res.json(responseObj);
    } catch (error: any) {
      console.error(`Error fetching request details: ${error.message}`);
      res.status(500).json({
        error: error.message || 'Failed to fetch request details',
      });
    }
  }
}

export const requestController = new RequestController(); 