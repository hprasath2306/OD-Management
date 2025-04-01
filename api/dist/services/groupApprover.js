import prisma from "../db/config.js";
export class GroupApproverService {
    // Create a new group approver
    async createGroupApprover(data) {
        return await prisma.groupApprover.create({
            data,
            include: {
                group: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    // Get all group approvers
    async getAllGroupApprovers() {
        return await prisma.groupApprover.findMany({
            include: {
                group: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    // Get group approver by ID
    async getGroupApproverById(id) {
        return await prisma.groupApprover.findUnique({
            where: { id },
            include: {
                group: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    // Get group approvers by group
    async getGroupApproversByGroup(groupId) {
        return await prisma.groupApprover.findMany({
            where: { groupId },
            include: {
                group: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    // Get group approvers by teacher
    async getGroupApproversByTeacher(teacherId) {
        return await prisma.groupApprover.findMany({
            where: { teacherId },
            include: {
                group: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    // Update group approver
    async updateGroupApprover(id, data) {
        return await prisma.groupApprover.update({
            where: { id },
            data,
            include: {
                group: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
    // Delete group approver
    async deleteGroupApprover(id) {
        return await prisma.groupApprover.delete({
            where: { id },
            include: {
                group: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
}
export const groupApproverService = new GroupApproverService();
