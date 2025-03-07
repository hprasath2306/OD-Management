import { z } from "zod";
import { Role } from "@prisma/client";



export const createFlowTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Flow template name is required"),
  }),
});

export const updateFlowTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid("Flow template ID must be a valid UUID"),
  }),
  body: z.object({
    name: z.string().min(1, "Flow template name is required").optional(),
  }),
});

export type CreateFlowTemplateInput = z.infer<typeof createFlowTemplateSchema>["body"];
export type UpdateFlowTemplateInput = z.infer<typeof updateFlowTemplateSchema>["body"]; 