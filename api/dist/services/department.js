import prisma from "../db/config.js";
export class DepartmentService {
    // Create a new department
    async createDepartment(data) {
        return await prisma.department.create({
            data,
        });
    }
    // Get all departments
    async getAllDepartments() {
        return await prisma.department.findMany({
            include: {
                teachers: true,
                groups: true,
                labs: true,
            },
        });
    }
    // Get department by ID
    async getDepartmentById(id) {
        return await prisma.department.findUnique({
            where: { id },
            include: {
                teachers: true,
                groups: true,
                labs: true,
            },
        });
    }
    // Update department
    async updateDepartment(id, data) {
        return await prisma.department.update({
            where: { id },
            data,
        });
    }
    // Delete department
    async deleteDepartment(id) {
        return await prisma.department.delete({
            where: { id },
        });
    }
    // Get department by code
    async getDepartmentByCode(code) {
        return await prisma.department.findUnique({
            where: { code },
            include: {
                teachers: true,
                groups: true,
                labs: true,
            },
        });
    }
}
export const departmentService = new DepartmentService();
