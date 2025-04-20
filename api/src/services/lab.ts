import { Lab } from '@prisma/client';
import prisma from "../db/config.js";

export class LabService {
  // Create a new lab
  async createLab(data: {
    name: string;
    departmentId: string;
    inchargeId: string;
  }): Promise<Lab> {
    // Verify that the department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      throw new Error("Department not found");
    }

    // Verify that the incharge (teacher) exists and belongs to the same department
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.inchargeId },
    });
    if (!teacher) {
      throw new Error("Teacher not found");
    }
    if (teacher.departmentId !== data.departmentId) {
      throw new Error("Lab incharge must belong to the same department");
    }

    return await prisma.lab.create({
      data,
      include: {
        department: true,
        incharge: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Get all labs
  async getAllLabs(): Promise<Lab[]> {
    return await prisma.lab.findMany({
      include: {
        department: true,
        incharge: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Get lab by ID
  async getLabById(id: string): Promise<Lab | null> {
    return await prisma.lab.findUnique({
      where: { id },
      include: {
        department: true,
        incharge: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Get labs by department
  async getLabsByDepartment(departmentId: string): Promise<Lab[]> {
    return await prisma.lab.findMany({
      where: { departmentId },
      include: {
        department: true,
        incharge: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Get labs by incharge
  async getLabsByIncharge(inchargeId: string): Promise<Lab[]> {
    return await prisma.lab.findMany({
      where: { inchargeId },
      include: {
        department: true,
        incharge: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Update lab
  async updateLab(
    id: string,
    data: {
      name?: string;
      departmentId?: string;
      inchargeId?: string;
    }
  ): Promise<Lab> {
    // If departmentId or inchargeId is being updated, verify the relationship
    if (data.departmentId || data.inchargeId) {
      const lab = await this.getLabById(id);
      if (!lab) {
        throw new Error("Lab not found");
      }

      const departmentId = data.departmentId || lab.departmentId;

      if (data.inchargeId) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: data.inchargeId },
        });
        if (!teacher) {
          throw new Error("Teacher not found");
        }
        if (teacher.departmentId !== departmentId) {
          throw new Error("Lab incharge must belong to the same department");
        }
      }
    }

    return await prisma.lab.update({
      where: { id },
      data,
      include: {
        department: true,
        incharge: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Delete lab
  async deleteLab(id: string): Promise<Lab> {
    return await prisma.lab.delete({
      where: { id },
      include: {
        department: true,
        incharge: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

export const labService = new LabService(); 