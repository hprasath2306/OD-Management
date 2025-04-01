import { z } from 'zod';
export const createTeacherSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Name is required',
        }).min(2, 'Name must be at least 2 characters'),
        email: z.string({
            required_error: 'Email is required',
        }).email('Invalid email format'),
        phone: z.string({
            required_error: 'Phone number is required',
        }).min(10, 'Phone number must be at least 10 digits'),
        departmentId: z.string({
            required_error: 'Department ID is required',
        }),
    }),
});
export const updateTeacherSchema = z.object({
    params: z.object({
        id: z.string({
            required_error: 'Teacher ID is required',
        }),
    }),
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').optional(),
        email: z.string().email('Invalid email format').optional(),
        phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
        departmentId: z.string().optional(),
    }),
});
