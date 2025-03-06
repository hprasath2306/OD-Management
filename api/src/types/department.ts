import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
    }).min(2, 'Name must be at least 2 characters'),
    code: z.string({
      required_error: 'Code is required',
    }).min(2, 'Code must be at least 2 characters'),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Department ID is required',
    }),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    code: z.string().min(2, 'Code must be at least 2 characters').optional(),
  }),
});

export type CreateDepartmentInput = z.TypeOf<typeof createDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.TypeOf<typeof updateDepartmentSchema>['body'];