export interface Student {
  id: string;
  rollNo: string;
  name: string;
  group: {
    id: string;
    name: string;
    section: string;
    batch: string;
  };
}

export interface RequestedBy {
  id: string;
  name: string | null;
  email: string;
}

export interface ApprovalStep {
  sequence: number;
  status: 'PENDING' | 'APPROVED';
  comments: string | null;
  approvedAt: string | null;
  approverId: string;
}

export interface Approval {
  groupId: string;
  groupName: string;
  status: 'PENDING' | 'APPROVED';
  currentStepIndex: number;
  steps: ApprovalStep[];
}

export interface FlowTemplate {
  id: string;
  name: string;
  steps: {
    sequence: number;
    role: string;
  }[];
}



export interface Request {
  id: string;
  type: 'LEAVE' | 'OD';
  category: 'PROJECT' | null;
  class: string | null;
  batch: string | null;
  needsLab: boolean;
  reason: string;
  description: string;
  startDate: string;
  endDate: string;
  lab: string | null;
  requestedBy: RequestedBy;
  students: Student[];
  approvals: Approval[];
  flowTemplate: FlowTemplate;
}

export interface Filters {
  dateFrom: string;
  dateTo: string;
  category: string;
  status: string;
}