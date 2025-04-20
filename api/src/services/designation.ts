import { Designation, Role } from '@prisma/client';
import prisma from "../db/config.js";

export class DesignationService {
  // Create a new designation
  async createDesignation(data: { role: Role; description?: string }): Promise<Designation> {
    return await prisma.designation.create({
      data,
    });
  }

  // Get all designations
  async getAllDesignations(): Promise<Designation[]> {
    return await prisma.designation.findMany({
      include: {
        teacherDesignations: true,
      },
    });
  }

  // Get designation by ID
  async getDesignationById(id: string): Promise<Designation | null> {
    return await prisma.designation.findUnique({
      where: { id },
      include: {
        teacherDesignations: true,
      },
    });
  }

  // Update designation
  async updateDesignation(
    id: string,
    data: { role?: Role; description?: string }
  ): Promise<Designation> {
    return await prisma.designation.update({
      where: { id },
      data,
    });
  }

  // Delete designation
  async deleteDesignation(id: string): Promise<Designation> {
    return await prisma.designation.delete({
      where: { id },
    });
  }

  // Get designation by role
  async getDesignationByRole(role: Role): Promise<Designation | null> {
    return await prisma.designation.findFirst({
      where: { role },
      include: {
        teacherDesignations: true,
      },
    });
  }
}

export const designationService = new DesignationService();
