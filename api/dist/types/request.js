import { z } from 'zod';
import { RequestType, ODCategory } from "@prisma/client";
// Schema for students in the request
const requestStudentSchema = z.object({
    studentId: z.string().uuid("Student ID must be a valid UUID"),
});
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
        labId: z.string().optional(),
        students: z.array(z.string()).min(1, "At least one student is required"),
        proofOfOD: z.string().nullable().optional(),
    }).refine((data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
    }, {
        message: "End date must be after or equal to start date",
    }).refine((data) => {
        return !data.needsLab || (data.needsLab && data.labId);
    }, {
        message: "Lab ID is required when needsLab is true",
    }),
});
export const processApprovalSchema = z.object({
    params: z.object({
        id: z.string().uuid("Request ID must be a valid UUID"),
    }),
    body: z.object({
        status: z.enum(["APPROVED", "REJECTED"], {
            errorMap: () => ({ message: "Status must be either APPROVED or REJECTED" }),
        }),
        comments: z.string().optional(),
        requestId: z.string()
    }),
});
