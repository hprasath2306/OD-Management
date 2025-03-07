import { Request, RequestType, ApprovalStatus, Approval, ApprovalStep, Role, ODCategory } from '@prisma/client';
import prisma from "../db/config";

export class RequestService {
  // Create a new request with approval flow
  async createRequest(data: {
    type: RequestType;
    category?: ODCategory | null;
    needsLab: boolean;
    reason: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    labId?: string | null;
    requestedById: string;
    students: { studentId: string }[];
  }): Promise<Request> {
    // Validate inputs
    if (data.endDate < data.startDate) {
      throw new Error("End date must be after or equal to start date");
    }
    if (data.needsLab && !data.labId) {
      throw new Error("Lab ID is required when lab is needed");
    }
    if (data.students.length === 0) {
      throw new Error("At least one student must be included in the request");
    }
  
    // Pre-transaction checks
    const [lab, students, flowTemplate] = await Promise.all([
      data.labId ? prisma.lab.findUnique({ where: { id: data.labId } }) : null,
      prisma.student.findMany({
        where: { id: { in: data.students.map(s => s.studentId) } },
        include: { group: true },
      }),
      prisma.flowTemplate.findFirst({
        where: { name: data.needsLab ? "LabFlow" : "NoLabFlow" },
        include: { steps: { orderBy: { sequence: 'asc' } } },
      }),
    ]);
  
    if (data.labId && !lab) throw new Error("Lab not found");
    if (students.length !== data.students.length) throw new Error("One or more students not found");
    if (!flowTemplate) throw new Error(`Flow template not found for ${data.needsLab ? "lab" : "no lab"} flow`);
  
    // Verify requestedBy is a student
    const requestedBy = await prisma.user.findUnique({
      where: { id: data.requestedById },
      include: { students: true },
    });
    if (!requestedBy || !requestedBy.students) throw new Error("RequestedBy must be a student");
  
    // Create request and approvals in a transaction
    return await prisma.$transaction(async (tx) => {
      const request = await tx.request.create({
        data: {
          type: data.type,
          category: data.category,
          needsLab: data.needsLab,
          reason: data.reason,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          labId: data.labId,
          requestedById: data.requestedById,
          flowTemplateId: flowTemplate.id,
          students: { create: data.students },
        },
        include: {
          students: { include: { student: { include: { user: true, group: true } } } },
          lab: true,
          requestedBy: true,
          FlowTemplate: { include: { steps: true } },
        },
      });
  
      const uniqueGroupIds = [...new Set(request.students.map(rs => rs.student.groupId))];
  
      for (const groupId of uniqueGroupIds) {
        const approval = await tx.approval.create({
          data: {
            requestId: request.id,
            groupId,
            currentStepIndex: 0,
            status: ApprovalStatus.PENDING,
          },
        });
  
        const approvers = await tx.groupApprover.findMany({
          where: { groupId },
          include: { teacher: { include: { user: true } } },
        });
  
        await tx.approvalStep.createMany({
          data: flowTemplate.steps.map((step) => {
            const approver = approvers.find((a) => a.role === step.role);
            if (!approver) throw new Error(`No approver found for role ${step.role} in group ${groupId}`);
            return {
              sequence: step.sequence,
              status: ApprovalStatus.PENDING,
              approvalId: approval.id,
              groupId,
              userId: approver.teacher.userId,
            };
          }),
        });
      }
  
      return request;
    });
  }
}
export const requestService = new RequestService();