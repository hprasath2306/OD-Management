import { Department } from '@prisma/client';

import prisma from "../db/config.js";


export class DepartmentService {
  // Create a new department
  async createDepartment(data: { name: string; code: string }): Promise<Department> {
    return await prisma.department.create({
      data,
    });
  }

  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    return await prisma.department.findMany({
      include: {
        teachers: true,
        groups: true,
        labs: true,
      },
    });
  }

  // Get department by ID
  async getDepartmentById(id: string): Promise<Department | null> {
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
  async updateDepartment(
    id: string,
    data: { name?: string; code?: string }
  ): Promise<Department> {
    return await prisma.department.update({
      where: { id },
      data,
    });
  }

  // Delete department
  async deleteDepartment(id: string): Promise<Department> {
    return await prisma.department.delete({
      where: { id },
    });
  }

  // Get department by code
  async getDepartmentByCode(code: string): Promise<Department | null> {
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