export enum RequestType {
  OD = 'OD',
  LEAVE = 'LEAVE'
}

export enum ODCategory {
  PROJECT = 'PROJECT',
  SEMINAR = 'SEMINAR',
  SYMPOSIUM = 'SYMPOSIUM',
  OTHER = 'OTHER'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface Student {
  id: string;
  user: User;
  groupId: string;
}

export interface Lab {
  id: string;
  name: string;
  inchargeId: string;
}

export interface ApprovalStep {
  id: string;
  sequence: number;
  status: ApprovalStatus;
  approvalId: string;
  userId: string;
  comments?: string;
  approvedAt?: Date;
  user?: User;
}

export interface Approval {
  id: string;
  requestId: string;
  groupId: string;
  currentStepIndex: number;
  status: ApprovalStatus;
  approvalSteps: ApprovalStep[];
}

export interface RequestStudent {
  requestId: string;
  studentId: string;
  student: Student;
}

export interface OdRequest {
  id: string;
  type: RequestType;
  category?: ODCategory;
  needsLab: boolean;
  reason: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  labId?: string;
  requestedById: string;
  flowTemplateId: string;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: User;
  lab?: Lab;
  students: RequestStudent[];
  approvals: Approval[];
  proofOfOD?: string;
} 