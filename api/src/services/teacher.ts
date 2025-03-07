import { Teacher, User, UserRole } from '@prisma/client';
import prisma from "../db/config";
import { Argon2id } from "oslo/password";

export class TeacherService {
  // Create a new teacher with user
  async createTeacher(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    departmentId: string;
  }): Promise<Teacher> {
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

  // Get all teachers
  async getAllTeachers(): Promise<Teacher[]> {
    return await prisma.teacher.findMany({
      include: {
        user: true,
        department: true,
      },
    });
  }

  // Get teacher by ID
  async getTeacherById(id: string): Promise<Teacher | null> {
    return await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
      },
    });
  }

  // Get teacher by email
  async getTeacherByEmail(email: string): Promise<Teacher | null> {
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

  async updateTeacher(
    id: string,
    data: { name?: string; email?: string; phone?: string; departmentId?: string }
  ): Promise<Teacher> {
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
  async deleteTeacher(id: string): Promise<Teacher> {
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