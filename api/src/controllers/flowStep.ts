import { Request, Response } from "express";
import { flowStepService } from "../services/flowStep.js";

export class FlowStepController {
  // Create a new flow step
  async createFlowStep(req: Request, res: Response) {
    try {
      const flowStep = await flowStepService.createFlowStep(req.body);
      res.status(201).json(flowStep);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get all flow steps
  async getAllFlowSteps(req: Request, res: Response) {
    try {
      const flowSteps = await flowStepService.getAllFlowSteps();
      res.status(200).json(flowSteps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get flow step by ID
  async getFlowStepById(req: Request, res: Response) {
    try {
      const flowStep = await flowStepService.getFlowStepById(req.params.id);
      if (!flowStep) {
        res.status(404).json({ error: "Flow step not found" });
      }
      res.status(200).json(flowStep);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get flow steps by template
  async getFlowStepsByTemplate(req: Request, res: Response) {
    try {
      const flowSteps = await flowStepService.getFlowStepsByTemplate(req.params.flowTemplateId);
      res.status(200).json(flowSteps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update flow step
  async updateFlowStep(req: Request, res: Response) {
    try {
      const flowStep = await flowStepService.updateFlowStep(
        req.params.id,
        req.body
      );
      res.status(200).json(flowStep);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete flow step
  async deleteFlowStep(req: Request, res: Response) {
    try {
      const flowStep = await flowStepService.deleteFlowStep(req.params.id);
      res.status(200).json(flowStep);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const flowStepController = new FlowStepController(); 