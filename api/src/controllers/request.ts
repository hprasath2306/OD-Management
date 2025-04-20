import { Request, Response } from "express";
import { requestService } from "../services/request.js";
import { UserRole, ApprovalStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      console.log(error)
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
 
  // Get all requests
  async getAllRequests(req: Request, res: Response) {
    try {
      const requests = await requestService.getAllRequests();
      res.json({ requests });
    } catch (error: any) {
      console.error(`Error fetching requests: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch requests' });
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
  
  // Get a specific request by ID
  async getRequestById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
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

      // Format the response
      const formattedRequest = {
        id: request.id,
        type: request.type,
        category: request.category,
        needsLab: request.needsLab,
        reason: request.reason,
        description: request.description,
        startDate: request.startDate,
        endDate: request.endDate,
        proofOfOD: request.proofOfOD, // Include proof of OD document URL
        lab: request.lab ? { id: request.lab.id, name: request.lab.name } : null,
        requestedBy: {
          id: request.requestedBy.id,
          name: request.requestedBy.name,
          email: request.requestedBy.email,
        },
        students: request.students.map(rs => ({
          id: rs.student.id,
          rollNo: rs.student.rollNo,
          regNo: rs.student.regNo,
          name: rs.student.user.name,
          group: rs.student.group ? {
            id: rs.student.group.id, 
            name: rs.student.group.name,
            section: rs.student.group.section,
            batch: rs.student.group.batch
          } : null,
        })),
        approvals: request.Approvals.map(approval => ({
          id: approval.id,
          groupId: approval.groupId,
          groupName: approval.group.name,
          status: approval.status,
          currentStepIndex: approval.currentStepIndex,
          steps: approval.approvalSteps.map(step => ({
            sequence: step.sequence,
            status: step.status,
            comments: step.comments,
            approvedAt: step.approvedAt,
            approver: step.User ? {
              id: step.User.id,
              name: step.User.name,
              email: step.User.email
            } : null,
          })),
        })),
      };

      res.json(formattedRequest);
    } catch (error: any) {
      console.error(`Error fetching request: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch request details' });
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
      
      // Get all previous steps for this approval
      const previousSteps = userApprovalStep
        ? request.Approvals
            .find(a => a.groupId === approverGroupId)
            ?.approvalSteps
            .filter(s => s.sequence < userApprovalStep.sequence)
            .map(s => ({
              sequence: s.sequence,
              status: s.status,
              comments: s.comments,
              approvedAt: s.approvedAt,
              approver: s.User ? {
                id: s.User.id,
                name: s.User.name,
                email: s.User.email,
                role: s.User.role
              } : null,
              role: request.FlowTemplate?.steps.find(fs => fs.sequence === s.sequence)?.role
            }))
        : [];

      // Get students for the group if it exists
      const groupStudents = approverGroupId
        ? request.students.filter(rs => rs.student.groupId === approverGroupId)
        : request.students;

      // Format the response
      const formattedRequest = {
        requestId: request.id,
        type: request.type,
        category: request.category,
        needsLab: request.needsLab,
        reason: request.reason,
        description: request.description,
        startDate: request.startDate,
        endDate: request.endDate,
        proofOfOD: request.proofOfOD, // Include proof of OD document URL
        lab: request.lab
          ? {
              id: request.lab.id,
              name: request.lab.name,
            }
          : null,
        submittedBy: {
          id: request.requestedBy.id,
          name: request.requestedBy.name,
          email: request.requestedBy.email,
        },
        students: groupStudents.map(rs => ({
          id: rs.student.id,
          rollNo: rs.student.rollNo,
          regNo: rs.student.regNo,
          attendancePercentage: rs.student.attendancePercentage,
          name: rs.student.user.name,
          group: rs.student.group ? {
            id: rs.student.group.id,
            name: rs.student.group.name,
            section: rs.student.group.section,
            batch: rs.student.group.batch
          } : null
        })),
        approvalStatus: approval?.status || null,
        currentStep: userApprovalStep ? {
          sequence: userApprovalStep.sequence,
          role: request.FlowTemplate?.steps.find(s => s.sequence === userApprovalStep.sequence)?.role,
        } : null,
        previousSteps: previousSteps || []
      };

      res.json(formattedRequest);
    } catch (error: any) {
      console.error(`Error fetching detailed request: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch request details' });
    }
  }
}

export const requestController = new RequestController(); 