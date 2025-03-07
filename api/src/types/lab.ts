import { z } from "zod";

export const createLabSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Lab name is required"),
    departmentId: z.string().uuid("Department ID must be a valid UUID"),
    inchargeId: z.string().uuid("Incharge ID must be a valid UUID"),
  }),
});

export const updateLabSchema = z.object({
  params: z.object({
    id: z.string().uuid("Lab ID must be a valid UUID"),
  }),
  body: z.object({
    name: z.string().min(1, "Lab name is required").optional(),
    departmentId: z.string().uuid("Department ID must be a valid UUID").optional(),
    inchargeId: z.string().uuid("Incharge ID must be a valid UUID").optional(),
  }),
});

export type CreateLabInput = z.infer<typeof createLabSchema>["body"];
export type UpdateLabInput = z.infer<typeof updateLabSchema>["body"]; 