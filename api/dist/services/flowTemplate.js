import prisma from "../db/config.js";
export class FlowTemplateService {
    // Create a new flow template with steps
    async createFlowTemplate(data) {
        // Check if name is unique
        const existingTemplate = await prisma.flowTemplate.findUnique({
            where: { name: data.name },
        });
        if (existingTemplate) {
            throw new Error("Flow template name must be unique");
        }
        // Create flow template and steps in a transaction
        return await prisma.$transaction(async (tx) => {
            // Create flow template
            const flowTemplate = await tx.flowTemplate.create({
                data: {
                    name: data.name,
                },
            });
            return flowTemplate;
        });
    }
    // Get all flow templates
    async getAllFlowTemplates() {
        return await prisma.flowTemplate.findMany({
            include: {
                steps: {
                    orderBy: {
                        sequence: 'asc',
                    },
                },
            },
        });
    }
    // Get flow template by ID
    async getFlowTemplateById(id) {
        return await prisma.flowTemplate.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: {
                        sequence: 'asc',
                    },
                },
            },
        });
    }
    // Get flow template by name
    async getFlowTemplateByName(name) {
        return await prisma.flowTemplate.findUnique({
            where: { name },
            include: {
                steps: {
                    orderBy: {
                        sequence: 'asc',
                    },
                },
            },
        });
    }
    // Update flow template
    async updateFlowTemplate(id, data) {
        // If updating name, check if new name is unique
        if (data.name) {
            const existingTemplate = await prisma.flowTemplate.findUnique({
                where: { name: data.name },
            });
            if (existingTemplate && existingTemplate.id !== id) {
                throw new Error("Flow template name must be unique");
            }
        }
        return await prisma.$transaction(async (tx) => {
            return await tx.flowTemplate.update({
                where: { id },
                data,
                include: {
                    steps: {
                        orderBy: {
                            sequence: 'asc',
                        },
                    },
                },
            });
        });
    }
    // Delete flow template
    async deleteFlowTemplate(id) {
        return await prisma.$transaction(async (tx) => {
            // Delete all steps first
            await tx.flowStep.deleteMany({
                where: { flowTemplateId: id },
            });
            // Then delete the template
            return await tx.flowTemplate.delete({
                where: { id },
                include: {
                    steps: true,
                },
            });
        });
    }
}
export const flowTemplateService = new FlowTemplateService();
