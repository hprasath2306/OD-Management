import { Role } from '@prisma/client';
import prisma from "../db/config.js";
export class TeacherDesignationService {
    // Create a new teacher designation
    async createTeacherDesignation(data) {
        // Get the designation details
        const designation = await prisma.designation.findUnique({
            where: { id: data.designationId },
        });
        if (!designation) {
            throw new Error("Designation not found");
        }
        // Get the teacher details to know their department
        const teacher = await prisma.teacher.findUnique({
            where: { id: data.teacherId },
        });
        if (!teacher) {
            throw new Error("Teacher not found");
        }
        // If the designation is HOD
        if (designation.role === Role.HOD) {
            // Check if there's already an HOD for this department
            const existingHOD = await prisma.teacherDesignation.findFirst({
                where: {
                    designation: {
                        role: Role.HOD,
                    },
                    teacher: {
                        departmentId: teacher.departmentId,
                    },
                },
                include: {
                    teacher: true,
                    designation: true,
                },
            });
            if (existingHOD) {
                // Remove the HOD designation from the existing HOD
                await prisma.teacherDesignation.delete({
                    where: { id: existingHOD.id },
                });
            }
        }
        // Create the new teacher designation
        return await prisma.teacherDesignation.create({
            data: {
                teacherId: data.teacherId,
                designationId: data.designationId,
            },
            include: {
                teacher: true,
                designation: true,
            },
        });
    }
    // Get all teacher designations
    async getAllTeacherDesignations() {
        return await prisma.teacherDesignation.findMany({
            include: {
                teacher: true,
                designation: true,
            },
        });
    }
    // Get teacher designation by ID
    async getTeacherDesignationById(id) {
        return await prisma.teacherDesignation.findUnique({
            where: { id },
            include: {
                teacher: true,
                designation: true,
            },
        });
    }
    // Get teacher designations by teacher ID
    async getTeacherDesignationsByTeacherId(teacherId) {
        return await prisma.teacherDesignation.findMany({
            where: { teacherId },
            include: {
                teacher: true,
                designation: true,
            },
        });
    }
    // Get teacher designations by designation ID
    async getTeacherDesignationsByDesignationId(designationId) {
        return await prisma.teacherDesignation.findMany({
            where: { designationId },
            include: {
                teacher: true,
                designation: true,
            },
        });
    }
    // Update teacher designation
    async updateTeacherDesignation(id, data) {
        return await prisma.teacherDesignation.update({
            where: { id },
            data,
            include: {
                teacher: true,
                designation: true,
            },
        });
    }
    // Delete teacher designation
    async deleteTeacherDesignation(id) {
        return await prisma.teacherDesignation.delete({
            where: { id },
            include: {
                teacher: true,
                designation: true,
            },
        });
    }
}
export const teacherDesignationService = new TeacherDesignationService();
