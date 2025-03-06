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
    return await prisma.teacher.update({
      where: { id },
      data,
      include: {
        user: true,
        department: true,
      },
    });
  }

  // Delete teacher
  async deleteTeacher(id: string): Promise<Teacher> {
    return await prisma.teacher.delete({
      where: { id },
      include: {
        user: true,
        department: true,
      },
    });
  }

}

export const teacherService = new TeacherService(); 