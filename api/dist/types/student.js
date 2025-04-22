import { z } from 'zod';
export const createStudentSchema = z.object({
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
        rollNo: z.string({
            required_error: 'Roll number is required',
        }),
        regNo: z.string({
            required_error: 'Registration number is required',
        }),
        departmentId: z.string({
            required_error: 'Department ID is required',
        }),
        attendancePercentage: z.number().min(0).max(100).optional(),
        groupId: z.string({
            required_error: 'Group ID is required',
        }),
    }),
});
export const updateStudentSchema = z.object({
    params: z.object({
        id: z.string({
            required_error: 'Student ID is required',
        }),
    }),
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').optional(),
        email: z.string().email('Invalid email format').optional(),
        phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
        rollNo: z.string().optional(),
        regNo: z.string().optional(),
        departmentId: z.string().optional(),
        attendancePercentage: z.number().min(0).max(100).nullable().optional(),
        groupId: z.string().optional(),
        numberOfOD: z.number().min(0).optional(),
    }),
});
