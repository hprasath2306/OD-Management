import { z } from "zod";
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
