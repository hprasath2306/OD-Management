import { UserRole } from '@prisma/client';
import prisma from "../db/config.js";
import { Argon2id } from "oslo/password";
export class StudentService {
    // Create a new student with user
    async createStudent(data) {
        const { name, email, phone, rollNo, regNo, attendancePercentage, groupId, departmentId } = data;
        // Default password is registration number
        const password = regNo;
        const hashedPassword = await new Argon2id().hash(password);
        // Create user and student in a transaction
        return await prisma.$transaction(async (tx) => {
            // Create user first
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password: hashedPassword,
                    role: UserRole.STUDENT,
                },
            });
            // Create student with user relation
            const student = await tx.student.create({
                data: {
                    rollNo,
                    regNo,
                    ...(attendancePercentage !== undefined && { attendancePercentage }),
                    userId: user.id,
                    departmentId,
                    groupId,
                },
                include: {
                    user: true,
                    group: {
                        include: {
                            department: true,
                        },
                    },
                },
            });
            return student;
        });
    }
    // bulk create students work for both create and update like upsert
    async bulkCreateStudents(data) {
        const { students } = data;
        // Create all students in a transaction to ensure data consistency
        return await prisma.$transaction(async (tx) => {
            const createdStudents = await Promise.all(students.map(async (student) => {
                // Hash the password (using regNo as default password)
                const hashedPassword = await new Argon2id().hash(student.regNo);
                // Try to find existing student by registration number
                const existingStudent = await tx.student.findUnique({
                    where: { regNo: student.regNo },
                    include: { user: true },
                });
                if (existingStudent) {
                    // Update existing student and their user
                    const updatedUser = await tx.user.update({
                        where: { id: existingStudent.user.id },
                        data: {
                            name: student.name,
                            email: student.email,
                            phone: student.phone,
                        },
                    });
                    return await tx.student.update({
                        where: { id: existingStudent.id },
                        data: {
                            rollNo: student.rollNo,
                            groupId: student.groupId,
                            ...(student.attendancePercentage !== undefined && {
                                attendancePercentage: student.attendancePercentage,
                            }),
                        },
                        include: {
                            user: true,
                            group: {
                                include: {
                                    department: true,
                                },
                            },
                        },
                    });
                }
                else {
                    // Create new user and student
                    const user = await tx.user.create({
                        data: {
                            name: student.name,
                            email: student.email,
                            phone: student.phone,
                            password: hashedPassword,
                            role: UserRole.STUDENT,
                        },
                    });
                    return await tx.student.create({
                        data: {
                            rollNo: student.rollNo,
                            regNo: student.regNo,
                            userId: user.id,
                            groupId: student.groupId,
                            ...(student.attendancePercentage !== undefined && {
                                attendancePercentage: student.attendancePercentage,
                            }),
                            departmentId: student.departmentId,
                        },
                        include: {
                            user: true,
                            group: {
                                include: {
                                    department: true,
                                },
                            },
                        },
                    });
                }
            }));
            return createdStudents;
        });
    }
    // Get all students
    async getAllStudents() {
        return await prisma.student.findMany({
            include: {
                user: true,
                group: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }
    // Get student by ID
    async getStudentById(id) {
        return await prisma.student.findUnique({
            where: { id },
            include: {
                user: true,
                group: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }
    // Get student by registration number
    async getStudentByRegNo(regNo) {
        return await prisma.student.findUnique({
            where: { regNo },
            include: {
                user: true,
                group: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }
    // Get students by group
    async getStudentsByGroup(groupId) {
        return await prisma.student.findMany({
            where: { groupId },
            include: {
                user: true,
                group: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }
    // Update student
    async updateStudent(id, data) {
        const { name, email, phone, ...studentData } = data;
        const student = await this.getStudentById(id);
        if (!student) {
            throw new Error('Student not found');
        }
        const hashedPassword = await new Argon2id().hash(studentData.regNo);
        return await prisma.$transaction(async (tx) => {
            // Update user information if provided
            if (name || email || phone) {
                await tx.user.update({
                    where: { id: student.userId },
                    data: {
                        name,
                        email,
                        phone,
                        password: hashedPassword,
                    },
                });
            }
            // Update student
            return await tx.student.update({
                where: { id },
                data: studentData,
                include: {
                    user: true,
                    group: {
                        include: {
                            department: true,
                        },
                    },
                },
            });
        });
    }
    // Delete student
    async deleteStudent(id) {
        const student = await this.getStudentById(id);
        if (!student) {
            throw new Error('Student not found');
        }
        return await prisma.$transaction(async (tx) => {
            // Delete student first
            const deletedStudent = await tx.student.delete({
                where: { id },
                include: {
                    user: true,
                    group: {
                        include: {
                            department: true,
                        },
                    },
                },
            });
            // Delete associated user
            await tx.user.delete({
                where: { id: student.userId },
            });
            return deletedStudent;
        });
    }
    // Reset a student's OD count
    async resetODCount(studentId) {
        // Verify student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            throw new Error('Student not found');
        }
        // Reset the numberOfOD to 0
        return prisma.student.update({
            where: { id: studentId },
            data: { numberOfOD: 0 },
        });
    }
    // Reset OD counts for all students in a group
    async resetGroupODCounts(groupId) {
        // Verify group exists
        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new Error('Group not found');
        }
        // Update all students in the group
        const result = await prisma.student.updateMany({
            where: { groupId },
            data: { numberOfOD: 0 },
        });
        return result.count;
    }
}
export const studentService = new StudentService();
