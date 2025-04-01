import { z } from "zod";
export const createTeacherDesignationSchema = z.object({
    body: z.object({
        teacherId: z.string().uuid(),
        designationId: z.string().uuid(),
    }),
});
export const updateTeacherDesignationSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        teacherId: z.string().uuid(),
        designationId: z.string().uuid(),
    }),
});
