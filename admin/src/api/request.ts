import { z } from "zod";

// Types based on schema
export type ODCategory = "PROJECT" | "SIH" | "SYMPOSIUM" | "OTHER";
export type RequestType = "OD" | "LEAVE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Lab {
  id: string;
  name: string;
}

export interface ApprovalStep {
  sequence: number;
  status: ApprovalStatus;
  comments: string | null;
  approvedAt: string | null;
  approverId: string | null;
}

export interface Approval {
  groupId: string;
  groupName: string;
  status: ApprovalStatus;
  currentStepIndex: number;
  steps: ApprovalStep[];
}

export interface ODRequest {
  id: string;
  type: RequestType;
  category: ODCategory;
  needsLab: boolean;
  reason: string;
  description?: string;
  startDate: string;
  endDate: string;
  requestedBy: { id: string; name: string, email: string };
  lab: {
    id: string;
    name: string;
  };
  createdAt: string;
  students: {
    id: string;
    name: string;
    rollNo: string;
    group: { id: string; name: string };
    
  }[];
  approvals?: Approval[];
  flowTemplate?: {
    id: string;
    name: string;
    steps: { sequence: number; role: string }[];
  };
}

export const odRequestSchema = z
  .object({
    type: z.enum(["OD", "LEAVE"]),
    category: z.enum(["PROJECT", "SIH", "SYMPOSIUM", "OTHER"]).optional(),
    needsLab: z.boolean().default(false),
    reason: z.string().min(1, "Reason is required"),
    description: z.string().optional(),
    startDate: z.string(),
    endDate: z.string(),
    labId: z.string().optional(),
    isTeamRequest: z.boolean().default(false),
    students: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      return !data.needsLab || (data.needsLab && data.labId);
    },
    {
      message: "Lab ID is required when lab access is needed",
      path: ["labId"],
    }
  );

export type ODRequestFormValues = z.infer<typeof odRequestSchema>;
