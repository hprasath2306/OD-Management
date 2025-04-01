import { z } from 'zod';
export const createGroupSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Name is required',
        }).min(2, 'Name must be at least 2 characters'),
        section: z.string({
            required_error: 'Section is required',
        }),
        batch: z.string({
            required_error: 'Batch is required',
        }),
        departmentId: z.string({
            required_error: 'Department ID is required',
        }),
    }),
});
export const updateGroupSchema = z.object({
    params: z.object({
        id: z.string({
            required_error: 'Group ID is required',
        }),
    }),
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').optional(),
        section: z.string().optional(),
        batch: z.string().optional(),
        departmentId: z.string().optional(),
    }),
});
