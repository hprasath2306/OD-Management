import { z } from 'zod';
import { Role } from '@prisma/client';
export const createDesignationSchema = z.object({
    body: z.object({
        role: z.nativeEnum(Role, {
            required_error: 'Role is required',
        }),
        description: z.string().optional(),
    }),
});
export const updateDesignationSchema = z.object({
    params: z.object({
        id: z.string({
            required_error: 'Designation ID is required',
        }),
    }),
    body: z.object({
        role: z.nativeEnum(Role).optional(),
        description: z.string().optional(),
    }),
});
