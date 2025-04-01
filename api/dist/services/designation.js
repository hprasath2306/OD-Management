import prisma from "../db/config.js";
export class DesignationService {
    // Create a new designation
    async createDesignation(data) {
        return await prisma.designation.create({
            data,
        });
    }
    // Get all designations
    async getAllDesignations() {
        return await prisma.designation.findMany({
            include: {
                teacherDesignations: true,
            },
        });
    }
    // Get designation by ID
    async getDesignationById(id) {
        return await prisma.designation.findUnique({
            where: { id },
            include: {
                teacherDesignations: true,
            },
        });
    }
    // Update designation
    async updateDesignation(id, data) {
        return await prisma.designation.update({
            where: { id },
            data,
        });
    }
    // Delete designation
    async deleteDesignation(id) {
        return await prisma.designation.delete({
            where: { id },
        });
    }
    // Get designation by role
    async getDesignationByRole(role) {
        return await prisma.designation.findFirst({
            where: { role },
            include: {
                teacherDesignations: true,
            },
        });
    }
}
export const designationService = new DesignationService();
