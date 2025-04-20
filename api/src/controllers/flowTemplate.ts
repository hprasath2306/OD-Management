import { Request, Response } from "express";
import { flowTemplateService } from "../services/flowTemplate.js";

export class FlowTemplateController {
  // Create a new flow template
  async createFlowTemplate(req: Request, res: Response) {
    try {
      const flowTemplate = await flowTemplateService.createFlowTemplate(req.body);
       res.status(201).json(flowTemplate);
    } catch (error: any) {
       res.status(400).json({ error: error.message });
    }
  }

  // Get all flow templates
  async getAllFlowTemplates(req: Request, res: Response) {
    try {
      const flowTemplates = await flowTemplateService.getAllFlowTemplates();
       res.status(200).json(flowTemplates);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  }

  // Get flow template by ID
  async getFlowTemplateById(req: Request, res: Response) {
    try {
      const flowTemplate = await flowTemplateService.getFlowTemplateById(req.params.id);
      if (!flowTemplate) {
         res.status(404).json({ error: "Flow template not found" });
      }
       res.status(200).json(flowTemplate);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  }

  // Get flow template by name
  async getFlowTemplateByName(req: Request, res: Response) {
    try {
      const flowTemplate = await flowTemplateService.getFlowTemplateByName(req.params.name);
      if (!flowTemplate) {
         res.status(404).json({ error: "Flow template not found" });
      }
       res.status(200).json(flowTemplate);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  }

  // Update flow template
  async updateFlowTemplate(req: Request, res: Response) {
    try {
      const flowTemplate = await flowTemplateService.updateFlowTemplate(
        req.params.id,
        req.body
      );
       res.status(200).json(flowTemplate);
    } catch (error: any) {
       res.status(400).json({ error: error.message });
    }
  }

  // Delete flow template
  async deleteFlowTemplate(req: Request, res: Response) {
    try {
      const flowTemplate = await flowTemplateService.deleteFlowTemplate(req.params.id);
       res.status(200).json(flowTemplate);
    } catch (error: any) {
       res.status(400).json({ error: error.message });
    }
  }
}

export const flowTemplateController = new FlowTemplateController(); 