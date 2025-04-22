import { Request, RequestType, ApprovalStatus, Approval, ApprovalStep, Role, ODCategory, UserRole } from '@prisma/client';
import prisma from "../db/config.js";  

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
    students: string[]; // Array of User IDs
    proofOfOD?: string; // URL of uploaded proof
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
    
    // Only check OD limits for OD type requests (not for LEAVE)
    if (data.type === RequestType.OD) {
      // Check if any of the students have reached the maximum OD requests limit (10)
      const studentRecords = await prisma.student.findMany({
        where: { userId: { in: data.students } },
        select: { id: true, user: { select: { name: true, email: true } }, numberOfOD: true }
      });

      const studentsWithMaxOD = studentRecords.filter(student => student.numberOfOD >= 10);
      
      if (studentsWithMaxOD.length > 0) {
        const studentNames = studentsWithMaxOD.map(s => s.user.name || s.user.email).join(', ');
        throw new Error(`The following students have reached the maximum number of OD requests: ${studentNames}`);
      }
    }
  
    // Pre-transaction checks
    const [lab, flowTemplate] = await Promise.all([
      data.labId ? prisma.lab.findUnique({ where: { id: data.labId }, include: { incharge: { include: { user: true } } } }) : null,
      prisma.flowTemplate.findFirst({
        where: { name: data.needsLab ? "LabFlow" : "NoLabFlow" },
        include: { steps: { orderBy: { sequence: 'asc' } } },
      }),
    ]);
  
    if (data.labId && !lab) throw new Error("Lab not found");
    if (!flowTemplate) throw new Error(`Flow template not found for ${data.needsLab ? "lab" : "no lab"} flow`);
    if (data.needsLab && !lab?.incharge?.user) throw new Error("Lab in-charge not found");
  
    // Create request and approvals in a transaction
    return await prisma.$transaction(async (tx) => {
      // Validate students by userId
      const students = await tx.student.findMany({
        where: { userId: { in: data.students } },
        include: { group: true },
      });
      if (students.length !== data.students.length) {
        throw new Error(`One or more students not found. Expected userIds: ${data.students}, Found: ${students.map(s => s.userId)}`);
      }

      // If it's an OD request, increment the numberOfOD for each student
      if (data.type === RequestType.OD) {
        for (const student of students) {
          await tx.student.update({
            where: { id: student.id },
            data: { numberOfOD: { increment: 1 } }
          });
        }
      }
      
      // Create the request
      const request = await tx.request.create({
        data: {
          type: data.type,
          category: data.category,
          needsLab: data.needsLab,
          reason: data.reason,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          labId: data.labId,
          requestedById: data.requestedById,
          flowTemplateId: flowTemplate.id,
          proofOfOD: data.proofOfOD,
          // status: ApprovalStatus.PENDING,
        },
      });
  
      // Create student associations
      await tx.requestStudent.createMany({
        data: students.map(student => ({
          requestId: request.id,
          studentId: student.id,
        })),
      });
  
      const uniqueGroupIds = [...new Set(students.map(s => s.groupId))];
  
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
  
        // Get the first step from the flow template
        const firstStep = flowTemplate.steps.find(step => step.sequence === 0);
        if (!firstStep) throw new Error("No first step found in flow template");
  
        // Create only the first ApprovalStep
        const approvalStepData = (() => {
          if (firstStep.role === 'LAB_INCHARGE' && data.needsLab) {
            return {
              sequence: firstStep.sequence,
              status: ApprovalStatus.PENDING,
              approvalId: approval.id,
              groupId,
              userId: lab!.incharge.user.id,
            };
          } else {
            const approver = approvers.find((a) => a.role === firstStep.role);
            if (!approver) throw new Error(`No approver found for role ${firstStep.role} in group ${groupId}`);
            return {
              sequence: firstStep.sequence,
              status: ApprovalStatus.PENDING,
              approvalId: approval.id,
              groupId,
              userId: approver.teacher.userId,
            };
          }
        })();
  
        await tx.approvalStep.create({
          data: approvalStepData,
        });
      }
  
      // Fetch and return the updated request
      const updatedRequest = await tx.request.findUnique({
        where: { id: request.id },
        include: {
          students: { include: { student: { include: { user: true, group: true } } } },
          lab: true,
          requestedBy: true,
          FlowTemplate: { include: { steps: true } },
        },
      });
  
      if (!updatedRequest) throw new Error("Failed to retrieve updated request");
  
      return updatedRequest;
    });
  }
  // Process an approval step
  async processApprovalStep(
    userId: string,
    data: {
      status: ApprovalStatus;
      requestId: string;
      comments?: string;
    }
  ): Promise<{
    message: string;
    status: ApprovalStatus;
  }> {
    // Find the pending step for this user and request
    const step = await prisma.approvalStep.findFirst({
      where: {
        userId,
        status: ApprovalStatus.PENDING,
        approval: { requestId: data.requestId },
      },
      include: {
        approval: {
          include: {
            approvalSteps: true,
            request: { include: { FlowTemplate: { include: { steps: true } } } },
            group: true,
          },
        },
      },
    });
  
    if (!step) {
      throw new Error('No pending step found for this user');
    }
  
    const approval = step.approval;
  
    return await prisma.$transaction(async (tx) => {
      // Update the current step
      await tx.approvalStep.update({
        where: { id: step.id },
        data: {
          status: data.status,
          comments: data.comments,
          approvedAt: data.status === ApprovalStatus.APPROVED ? new Date() : null,
        },
      });
  
      if (data.status === ApprovalStatus.REJECTED) {
        // Update Approval and Request to REJECTED
        await tx.approval.update({
          where: { id: approval.id },
          data: { status: ApprovalStatus.REJECTED },
        });
        await tx.request.update({
          where: { id: data.requestId },
          data: { status: ApprovalStatus.REJECTED },
        });
        return { message: 'Group approval rejected', status: ApprovalStatus.REJECTED };
      }
  
      // Handle APPROVED: Check for next step in FlowTemplate
      const nextStepIndex = approval.currentStepIndex + 1;
      const flowSteps = approval.request.FlowTemplate!.steps; // FlowTemplate is required in schema
      const nextFlowStep = flowSteps.find(s => s.sequence === nextStepIndex );
  
      if (!nextFlowStep) {
        // No more steps in this group's flow, mark Approval as APPROVED
        await tx.approval.update({
          where: { id: approval.id },
          data: { status: ApprovalStatus.APPROVED },
        });
  
        // Check all approvals for the request
        const allApprovals = await tx.approval.findMany({
          where: { requestId: data.requestId },
        });
        const allApproved = allApprovals.every(a => a.status === ApprovalStatus.APPROVED);
        const anyRejected = allApprovals.some(a => a.status === ApprovalStatus.REJECTED);
  
        if (anyRejected) {
          await tx.request.update({
            where: { id: data.requestId },
            data: { status: ApprovalStatus.REJECTED },
          });
          return { message: 'Request rejected due to one group rejection', status: ApprovalStatus.REJECTED };
        }
  
        if (allApproved) {
          await tx.request.update({
            where: { id: data.requestId },
            data: { status: ApprovalStatus.APPROVED },
          });
          return { message: 'Request fully approved by all groups', status: ApprovalStatus.APPROVED };
        }
  
        return { message: 'Group approval complete, awaiting other groups', status: ApprovalStatus.PENDING };
      }
  
      // Create the next ApprovalStep
      const approvers = await tx.groupApprover.findMany({
        where: { groupId: approval.groupId },
        include: { teacher: { include: { user: true } } },
      });
  
      const lab = approval.request.needsLab && approval.request.labId
        ? await tx.lab.findUnique({
            where: { id: approval.request.labId },
            include: { incharge: { include: { user: true } } },
          })
        : null;
  
      const nextStepData =  (async () => {
        if (nextFlowStep.role === 'LAB_INCHARGE' && approval.request.needsLab) {
          if (!lab) throw new Error('Lab not found for LAB_INCHARGE step');
          return {
            sequence: nextFlowStep.sequence,
            status: ApprovalStatus.PENDING,
            approvalId: approval.id,
            groupId: approval.groupId,
            userId: lab.incharge.user.id,
          };
        }
        else if(nextFlowStep.role === 'HOD') {
          // const hod = approvers.find(a => a.role === Role.HOD);
          const groupDepartmentId = approval.group.departmentId;
          const hod = await tx.teacher.findFirst({
          where: {
            departmentId: groupDepartmentId,
            teacherDesignations: {
              some: {
                designation: { role: 'HOD' },
              },
            },
          },
          include: { user: true },
        });

        if (!hod) throw new Error(`No HOD found for department ${groupDepartmentId}`);
        return {
          sequence: nextFlowStep.sequence,
          status: ApprovalStatus.PENDING,
          approvalId: approval.id,
          groupId: approval.groupId,
          userId: hod.user.id,
        };
        }
        else {
          const approver = approvers.find(a => a.role === nextFlowStep.role);
          if (!approver) throw new Error(`No approver found for role ${nextFlowStep.role} in group ${approval.groupId}`);
          return {
            sequence: nextFlowStep.sequence,
            status: ApprovalStatus.PENDING,
            approvalId: approval.id,
            groupId: approval.groupId,
            userId: approver.teacher.userId,
          };
        }
      })();
  
      await tx.approvalStep.create({
        data: await nextStepData,
      });
  
      // Update currentStepIndex
      await tx.approval.update({
        where: { id: approval.id },
        data: { currentStepIndex: nextStepIndex },
      });
  
      return { message: 'Step approved, next step created', status: ApprovalStatus.PENDING };
    });
  }
  // Get requests for approver
  async getApproverRequests(userId: string): Promise<any[]> {
    console.log(`Getting approver requests for userId: ${userId}`);
    
    // Fetch pending ApprovalSteps for this approver
    const pendingSteps = await prisma.approvalStep.findMany({
      where: {
        userId,
        status: ApprovalStatus.PENDING,
      },
      include: {
        approval: {
          include: {
            approvalSteps: {
              include: {
                User: true
              },
              orderBy: {
                sequence: 'asc'
              }
            },
            request: {
              include: {
                students: {
                  include: {
                    student: {
                      include: {
                        user: true,
                        group: true,
                      },
                    },
                  },
                },
                lab: true,
                requestedBy: true,
                FlowTemplate: {
                  include: {
                    steps: true,
                  },
                },
              },
            },
          },
        },
        group: true,
      },
    });

    console.log(`Found ${pendingSteps.length} pending approval steps for user ${userId}`);
    
    return pendingSteps.map((step) => {
      const { request, approvalSteps } = step.approval;
      const approverGroupId = step.groupId;

      console.log(`Processing step ${step.id}, sequence: ${step.sequence}, for request ${request.id}`);
      console.log(`This approval has ${approvalSteps.length} total steps`);

      // Filter students to only those in the approver's group
      const groupStudents = request.students.filter(
        (rs) => rs.student.groupId === approverGroupId
      );
      
      // Get previous approval steps with comments
      const previousSteps = approvalSteps
        .filter(s => s.sequence < step.sequence)
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
        }));

      console.log(`For step sequence ${step.sequence}, found ${previousSteps.length} previous steps`);
      if (previousSteps.length > 0) {
        console.log(`Previous steps: ${JSON.stringify(previousSteps)}`);
      } else {
        console.log(`No previous steps found - this must be the first approval step (Sequence ${step.sequence})`);
      }

      return {
        requestId: request.id,
        type: request.type,
        category: request.category,
        needsLab: request.needsLab,
        reason: request.reason,
        description: request.description,
        startDate: request.startDate,
        endDate: request.endDate,
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
        students: groupStudents.map((rs) => ({
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
        approvalStatus: step.approval.status,
        currentStep: {
          sequence: step.sequence,
          role: request.FlowTemplate?.steps.find((s) => s.sequence === step.sequence)?.role,
        },
        // Add previous approval steps with comments
        previousSteps: previousSteps,
        // Include proof of OD document URL if it exists
        proofOfOD: request.proofOfOD || null
      };
    });
  }

  // Get requests for a student
  // Get requests for a student


  


  async getStudentRequests(userId: string): Promise<any[]> {
    // First verify the user is a student
    console.log("userId",userId);
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!student) {
      throw new Error('User is not a student');
    }
  console.log("student",student);
    // Fetch all requests associated with the student
    const requests = await prisma.request.findMany({
      where: {
        students: {
          some: {
            studentId: student.id, // Match requests where this student is involved
          },
        },
      },
      include: {
        students: {
          include: {
            student: {
              include: { user: true, group: true }, // Include student details
            },
          },
        },
        lab: true, // Include lab details if applicable
        requestedBy: true, // Include the user who requested it
        FlowTemplate: {
          include: { steps: true }, // Include the approval flow template
        },
        Approvals: {
          include: {
            approvalSteps: true, // Include approval steps for status tracking
            group: true, // Include group details
          },
        },
      },
    });

    // Format the response (optional, adjust based on your needs)
    const formattedRequests = requests.map(request => ({
      id: request.id,
      type: request.type,
      category: request.category,
      needsLab: request.needsLab,
      reason: request.reason,
      description: request.description,
      startDate: request.startDate,
      endDate: request.endDate,
      lab: request.lab ? { id: request.lab.id, name: request.lab.name } : null,
      requestedBy: {
        id: request.requestedBy.id,
        name: request.requestedBy.name,
        email: request.requestedBy.email,
      },
      students: request.students.map(rs => ({
        id: rs.student.id,
        rollNo: rs.student.rollNo,
        name: rs.student.user.name,
        group: rs.student.group ? { id: rs.student.group.id, name: rs.student.group.name } : null,
      })),
      // status: request.status, // Overall request status
      approvals: request.Approvals.map(approval => ({
        groupId: approval.groupId,
        groupName: approval.group.name,
        status: approval.status,
        currentStepIndex: approval.currentStepIndex,
        steps: approval.approvalSteps.map(step => ({
          sequence: step.sequence,
          status: step.status,
          comments: step.comments,
          approvedAt: step.approvedAt,
          approverId: step.userId,
        })),
      })),
      flowTemplate: {
        id: request.FlowTemplate?.id,
        name: request.FlowTemplate?.name,
        steps: request.FlowTemplate?.steps.map(step => ({
          sequence: step.sequence,
          role: step.role,
        })),
      },
    }));

console.log(formattedRequests);

    return formattedRequests;
  }

  // admin to see all requests
  
  async getAllRequests(): Promise<any[]> {
    // Fetch all requests
    const requests = await prisma.request.findMany({
      include: {
        students: {
          include: {
            student: {
              include: { user: true, group: true }, // Include student details
            },
          },
        },
        lab: true, // Include lab details if applicable
        requestedBy: true, // Include the user who requested it
        FlowTemplate: {
          include: { steps: true }, // Include the approval flow template
        },
        Approvals: {
          include: {
            approvalSteps: true, // Include approval steps for status tracking
            group: true, // Include group details
          },
        },
      },
    });

    // Format the response (optional, adjust based on your needs)
    const formattedRequests = requests.map(request => ({
      id: request.id,
      type: request.type,
      category: request.category,
      needsLab: request.needsLab,
      reason: request.reason,
      description: request.description,
      startDate: request.startDate,
      endDate: request.endDate,
      lab: request.lab ? { id: request.lab.id, name: request.lab.name } : null,
      requestedBy: {
        id: request.requestedBy.id,
        name: request.requestedBy.name,
        email: request.requestedBy.email,
      },
      students: request.students.map(rs => ({
        id: rs.student.id,
        rollNo: rs.student.rollNo,
        name: rs.student.user.name,
        group: rs.student.group ? { id: rs.student.group.id, name: rs.student.group.name , section: rs.student.group.section,
          batch:rs.student.group.batch,} : null,
      }),
      ),
      // status: request.status, // Overall request status
      approvals: request.Approvals.map(approval => ({
        groupId: approval.groupId,
        groupName: approval.group.name,
        status: approval.status,
        currentStepIndex: approval.currentStepIndex,
        steps: approval.approvalSteps.map(step => ({
          sequence: step.sequence,
          status: step.status,
          comments: step.comments,
          approvedAt: step.approvedAt,
          approverId: step.userId,
        })),
      }),
      ),
      flowTemplate: {
        id: request.FlowTemplate?.id,
        name: request.FlowTemplate?.name,
        steps: request.FlowTemplate?.steps.map(step => ({
          sequence: step.sequence,
          role: step.role,
        })),
      },
    }));

    return formattedRequests;

  }

  // like the getallrequests reponse for admin
  // get all requests for groups like hod, YearIncharge, teacher  based on ther ids
  
// Fetch all requests associated with the teacher
async getGroupRequests(userId: string): Promise<any[]> {
  // First verify the user is a teacher
  console.log("userId", userId);
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!teacher) {
    throw new Error('User is not a teacher');
  }
  console.log("teacher", teacher);

  // Fetch all requests associated with the teacher
  const requests = await prisma.request.findMany({
    where: {
      OR: [
        // Requests where the teacher is an approver in any approval step
        {
          Approvals: {
            some: {
              approvalSteps: {
                some: {
                  userId: teacher.userId, // Teacher is directly involved in an approval step
                },
              },
            },
          },
        },
        // Requests where the teacher is a group approver (e.g., TUTOR, YEAR_INCHARGE)
        {
          Approvals: {
            some: {
              group: {
                groupApprovers: {
                  some: {
                    teacherId: teacher.id,
                  },
                },
              },
            },
          },
        },
        // Requests where the teacher is a lab in-charge (if applicable)
        {
          needsLab: true,
          lab: {
            inchargeId: teacher.id,
          },
        },
      ],
    },
    include: {
      students: {
        include: {
          student: {
            include: { user: true, group: { include: { department: true } } },
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
              User: true, // Include approver details
            },
          },
          group: { include: { department: true } },
        },
      },
    },
  });

  // Format the response
  const formattedRequests = requests.map(request => {
    // Map groupId to approval details for student mapping
    const groupApprovalMap = new Map(
      request.Approvals.map(approval => [
        approval.groupId,
        {
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
              email: step.User.email,
              role: step.User.role,
            } : null,
          })),
        },
      ])
    );

    return {
      id: request.id,
      type: request.type,
      category: request.category,
      needsLab: request.needsLab,
      reason: request.reason,
      description: request.description,
      startDate: request.startDate,
      endDate: request.endDate,
      lab: request.lab ? { id: request.lab.id, name: request.lab.name } : null,
      requestedBy: {
        id: request.requestedBy.id,
        name: request.requestedBy.name,
        email: request.requestedBy.email,
      },
      students: request.students.map(rs => ({
        id: rs.student.id,
        rollNo: rs.student.rollNo,
        name: rs.student.user.name,
        group: rs.student.group ? {
          id: rs.student.group.id,
          name: rs.student.group.name,
          section: rs.student.group.section,
          batch:rs.student.group.batch,
          department: rs.student.group.department ? {
            id: rs.student.group.department.id,
            name: rs.student.group.department.name,
          } : null,
        } : null,
        approval: rs.student.groupId ? groupApprovalMap.get(rs.student.groupId) || {
          status: 'PENDING',
          currentStepIndex: 0,
          steps: [],
        } : {
          status: 'PENDING',
          currentStepIndex: 0,
          steps: [],
        },
      })),
      status: request.status, // Overall request status
      approvals: request.Approvals.map(approval => ({
        groupId: approval.groupId,
        groupName: approval.group.name,
        department: approval.group.department ? {
          id: approval.group.department.id,
          name: approval.group.department.name,
        } : null,
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
            email: step.User.email,
            role: step.User.role,
          } : null,
        })),
      })),
      flowTemplate: {
        id: request.FlowTemplate?.id,
        name: request.FlowTemplate?.name,
        steps: request.FlowTemplate?.steps.map(step => ({
          sequence: step.sequence,
          role: step.role,
        })) || [],
      },
    };
  });

  return formattedRequests;
}

}


// for admin to see all requests








export const requestService = new RequestService();