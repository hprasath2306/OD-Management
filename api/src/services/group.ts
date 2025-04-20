import { Group } from '@prisma/client';
import prisma from "../db/config.js";

export class GroupService {
  // Create a new group
  async createGroup(data: {
    name: string;
    section: string;
    batch: string;
    departmentId: string;
  }): Promise<Group> {
    return await prisma.group.create({
      data,
      include: {
        department: true,
      },
    });
  }

  // Get all groups
  async getAllGroups(): Promise<Group[]> {
    return await prisma.group.findMany({
      include: {
        department: true,
      },
    });
  }

  // Get group by ID
  async getGroupById(id: string): Promise<Group | null> {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });
  }

  // Update group
  async updateGroup(
    id: string,
    data: {
      name?: string;
      section?: string;
      batch?: string;
      departmentId?: string;
    }
  ): Promise<Group> {
    return await prisma.group.update({
      where: { id },
      data,
      include: {
        department: true,
      },
    });
  }

  // Delete group
  async deleteGroup(id: string): Promise<Group> {
    return await prisma.group.delete({
      where: { id },
      include: {
        department: true,
      },
    });
  }

  // Get groups by department
  async getGroupsByDepartment(departmentId: string): Promise<Group[]> {
    return await prisma.group.findMany({
      where: { departmentId },
      include: {
        department: true,
      },
    });
  }
}

export const groupService = new GroupService(); 