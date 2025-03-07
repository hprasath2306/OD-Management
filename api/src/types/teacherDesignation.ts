import { z } from "zod";

export const createTeacherDesignationSchema = z.object({
  teacherId: z.string().uuid("Teacher ID must be a valid UUID"),
  designationId: z.string().uuid("Designation ID must be a valid UUID"),
});

export const updateTeacherDesignationSchema = z.object({
  teacherId: z.string().uuid("Teacher ID must be a valid UUID").optional(),
  designationId: z.string().uuid("Designation ID must be a valid UUID").optional(),
});

export type CreateTeacherDesignationInput = z.infer<typeof createTeacherDesignationSchema>;
export type UpdateTeacherDesignationInput = z.infer<typeof updateTeacherDesignationSchema>; 