import { z } from 'zod';
import { Role } from '@prisma/client';

export const createGroupApproverSchema = z.object({
  body: z.object({
    groupId: z.string({
      required_error: 'Group ID is required',
    }),
    teacherId: z.string({
      required_error: 'Teacher ID is required',
    }),
    role: z.nativeEnum(Role, {
      required_error: 'Role is required',
    }),
  }),
});

export const updateGroupApproverSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Group Approver ID is required',
    }),
  }),
  body: z.object({
    groupId: z.string().optional(),
    teacherId: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
  }),
});

export type CreateGroupApproverInput = z.TypeOf<typeof createGroupApproverSchema>['body'];
export type UpdateGroupApproverInput = z.TypeOf<typeof updateGroupApproverSchema>['body']; 