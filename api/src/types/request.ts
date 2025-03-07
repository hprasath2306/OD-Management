import { z } from 'zod'
import { RequestType, ODCategory, ApprovalStatus } from "@prisma/client"



export const createRequestSchema = z.object({
  body: z.object({
    type: z.nativeEnum(RequestType, {
      errorMap: () => ({ message: "Invalid request type" }),
    }),
    category: z.nativeEnum(ODCategory, {
      errorMap: () => ({ message: "Invalid OD category" }),
    }).optional(),
    needsLab: z.boolean().default(false),
    reason: z.string().min(1, "Reason is required"),
    description: z.string().optional(),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    labId: z.string().uuid("Lab ID must be a valid UUID").optional(),
    students: z.array(z.string().uuid("Student ID must be a valid UUID")).optional(),

  }),
})    

