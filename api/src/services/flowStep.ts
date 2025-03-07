import { FlowStep, Role } from '@prisma/client';
import prisma from "../db/config";

export class FlowStepService {
  // Create a new flow step
  async createFlowStep(data: {
    sequence: number;
    role: Role;
    flowTemplateId: string;
  }): Promise<FlowStep> {
    // Verify that the flow template exists
    const flowTemplate = await prisma.flowTemplate.findUnique({
      where: { id: data.flowTemplateId },
    });
    if (!flowTemplate) {
      throw new Error("Flow template not found");
    }

    // Check if sequence is unique within the flow template
    const existingStep = await prisma.flowStep.findFirst({
      where: {
        flowTemplateId: data.flowTemplateId,
        sequence: data.sequence,
      },
    });
    if (existingStep) {
      throw new Error("Sequence number must be unique within the flow template");
    }

    return await prisma.flowStep.create({
      data,
      include: {
        flowTemplate: true,
      },

    });
  }

  // Get all flow steps
  async getAllFlowSteps(): Promise<FlowStep[]> {
    return await prisma.flowStep.findMany({
      include: {
        flowTemplate: true,
      },
      orderBy: {
        sequence: 'asc',
      },
    });
  }

  // Get flow step by ID
  async getFlowStepById(id: string): Promise<FlowStep | null> {
    return await prisma.flowStep.findUnique({
      where: { id },
      include: {
        flowTemplate: true,
      },
    });
  }

  // Get flow steps by template
  async getFlowStepsByTemplate(flowTemplateId: string): Promise<FlowStep[]> {
    return await prisma.flowStep.findMany({
      where: { flowTemplateId },
      include: {
        flowTemplate: true,
      },
      orderBy: {
        sequence: 'asc',
      },
    });
  }

  // Update flow step
  async updateFlowStep(
    id: string,
    data: {
      sequence?: number;
      role?: Role;
      flowTemplateId?: string;
    }
  ): Promise<FlowStep> {
    const step = await this.getFlowStepById(id);
    if (!step) {
      throw new Error("Flow step not found");
    }

    // If changing sequence or template, check for uniqueness
    if (data.sequence || data.flowTemplateId) {
      const templateId = data.flowTemplateId || step.flowTemplateId;
      const sequence = data.sequence || step.sequence;

      const existingStep = await prisma.flowStep.findFirst({
        where: {
          flowTemplateId: templateId,
          sequence: sequence,
          NOT: {
            id: id,
          },
        },
      });

      if (existingStep) {
        throw new Error("Sequence number must be unique within the flow template");
      }
    }

    // If changing template, verify it exists
    if (data.flowTemplateId) {
      const flowTemplate = await prisma.flowTemplate.findUnique({
        where: { id: data.flowTemplateId },
      });
      if (!flowTemplate) {
        throw new Error("Flow template not found");
      }
    }

    return await prisma.flowStep.update({
      where: { id },
      data,
      include: {
        flowTemplate: true,
      },
    });
  }

  // Delete flow step
  async deleteFlowStep(id: string): Promise<FlowStep> {
    return await prisma.flowStep.delete({
      where: { id },
      include: {
        flowTemplate: true,
      },
    });
  }
}

export const flowStepService = new FlowStepService(); 