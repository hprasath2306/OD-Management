import { UserRole } from '@prisma/client';
import prisma from "../db/config.js";
import { Argon2id } from "oslo/password";
export class TeacherService {
    // Create a new teacher with user
    async createTeacher(data) {
        const { name, email, phone, password, departmentId } = data;
        // Hash the password
        const hashedPassword = await new Argon2id().hash(password);
        // Create user and teacher in a transaction
        return await prisma.$transaction(async (tx) => {
            // Create user first
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password: hashedPassword,
                    role: UserRole.TEACHER,
                },
            });
            // Create teacher with user relation
            const teacher = await tx.teacher.create({
                data: {
                    userId: user.id,
                    departmentId,
                },
                include: {
                    user: true,
                    department: true,
                },
            });
            return teacher;
        });
    }
    //bulk create teachers work for both create and update like upsert
    async bulkCreateTeachers(data) {
        const { teachers } = data;
        // console.log(teachers)
        // Create all teachers in a transaction to ensure data consistency
        return await prisma.$transaction(async (tx) => {
            const createdTeachers = await Promise.all(teachers.map(async (teacher) => {
                // Hash the password
                const hashedPassword = await new Argon2id().hash(teacher.password);
                // Try to find existing teacher by email
                const existingTeacher = await tx.teacher.findFirst({
                    where: {
                        user: {
                            email: teacher.email,
                        },
                    },
                    include: {
                        user: true,
                        department: true,
                        teacherDesignations: {
                            include: {
                                designation: true,
                            },
                        },
                    },
                });
                if (existingTeacher) {
                    // Update existing teacher and their user
                    await tx.user.update({
                        where: { id: existingTeacher.userId },
                        data: {
                            name: teacher.name,
                            phone: teacher.phone,
                            // Only update password if provided and different from existing
                            ...(teacher.password && { password: hashedPassword }),
                        },
                    });
                    // Update teacher
                    return await tx.teacher.update({
                        where: { id: existingTeacher.id },
                        data: {
                            departmentId: teacher.departmentId,
                        },
                        include: {
                            user: true,
                            department: true,
                            teacherDesignations: {
                                include: {
                                    designation: true,
                                },
                            },
                        },
                    });
                }
                else {
                    // Create new user and teacher
                    const user = await tx.user.create({
                        data: {
                            name: teacher.name,
                            email: teacher.email,
                            phone: teacher.phone,
                            password: hashedPassword,
                            role: UserRole.TEACHER,
                        },
                    });
                    // Create teacher
                    return await tx.teacher.create({
                        data: {
                            userId: user.id,
                            departmentId: teacher.departmentId,
                        },
                        include: {
                            user: true,
                            department: true,
                            teacherDesignations: {
                                include: {
                                    designation: true,
                                },
                            },
                        },
                    });
                }
            }));
            return createdTeachers;
        });
    }
    // Get all teachers
    async getAllTeachers() {
        return await prisma.teacher.findMany({
            include: {
                user: true,
                department: true,
            },
        });
    }
    // Get teacher by ID
    async getTeacherById(id) {
        return await prisma.teacher.findUnique({
            where: { id },
            include: {
                user: true,
                department: true,
            },
        });
    }
    // Get teacher by email
    async getTeacherByEmail(email) {
        return await prisma.teacher.findFirst({
            where: {
                user: {
                    email,
                },
            },
            include: {
                user: true,
                department: true,
            },
        });
    }
    // Update teacher
    async updateTeacher(id, data) {
        return await prisma.$transaction(async (tx) => {
            const teacherUpdate = await tx.teacher.update({
                where: { id },
                data: {
                    ...(data.departmentId !== undefined && { departmentId: data.departmentId }), // Only update if provided
                },
                include: {
                    user: true,
                    department: true,
                },
            });
            if (data.name !== undefined || data.email !== undefined || data.phone !== undefined) {
                await tx.user.update({
                    where: { id: teacherUpdate.userId },
                    data: {
                        ...(data.name !== undefined && { name: data.name }),
                        ...(data.email !== undefined && { email: data.email }),
                        ...(data.phone !== undefined && { phone: data.phone }),
                    },
                });
            }
            return teacherUpdate;
        });
    }
    // Delete teacher and associated user
    async deleteTeacher(id) {
        return await prisma.$transaction(async (tx) => {
            // Find the teacher to get the userId
            const teacher = await tx.teacher.findUnique({
                where: { id },
                include: {
                    user: true,
                    department: true,
                },
            });
            if (!teacher) {
                throw new Error('Teacher not found');
            }
            // Delete the teacher
            await tx.teacher.delete({
                where: { id },
            });
            // Delete the associated user
            await tx.user.delete({
                where: { id: teacher.userId },
            });
            return teacher;
        });
    }
}
export const teacherService = new TeacherService();
