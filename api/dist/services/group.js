import prisma from "../db/config.js";
export class GroupService {
    // Create a new group
    async createGroup(data) {
        return await prisma.group.create({
            data,
            include: {
                department: true,
            },
        });
    }
    // Get all groups
    async getAllGroups() {
        return await prisma.group.findMany({
            include: {
                department: true,
            },
        });
    }
    // Get group by ID
    async getGroupById(id) {
        return await prisma.group.findUnique({
            where: { id },
            include: {
                department: true,
            },
        });
    }
    // Update group
    async updateGroup(id, data) {
        return await prisma.group.update({
            where: { id },
            data,
            include: {
                department: true,
            },
        });
    }
    // Delete group
    async deleteGroup(id) {
        return await prisma.group.delete({
            where: { id },
            include: {
                department: true,
            },
        });
    }
    // Get groups by department
    async getGroupsByDepartment(departmentId) {
        return await prisma.group.findMany({
            where: { departmentId },
            include: {
                department: true,
            },
        });
    }
}
export const groupService = new GroupService();
