import { z } from "zod";
import { Role } from "@prisma/client";

export const createFlowStepSchema = z.object({
  body: z.object({
    sequence: z.number().min(1, "Sequence must be greater than 0"),
    role: z.nativeEnum(Role, {
      errorMap: () => ({ message: "Invalid role" }),
    }),
    flowTemplateId: z.string().uuid("Flow template ID must be a valid UUID"),
  }),
});

export const updateFlowStepSchema = z.object({
  params: z.object({
    id: z.string().uuid("Flow step ID must be a valid UUID"),
  }),
  body: z.object({
    sequence: z.number().min(1, "Sequence must be greater than 0").optional(),
    role: z.nativeEnum(Role, {
      errorMap: () => ({ message: "Invalid role" }),
    }).optional(),
    flowTemplateId: z.string().uuid("Flow template ID must be a valid UUID").optional(),
  }),
});

export type CreateFlowStepInput = z.infer<typeof createFlowStepSchema>["body"];
export type UpdateFlowStepInput = z.infer<typeof updateFlowStepSchema>["body"]; 