import { Request, Response } from "express";
import { labService } from "../services/lab.js";

export class LabController {
  // Create a new lab
  async createLab(req: Request, res: Response) {
    try {
      const lab = await labService.createLab(req.body);
      res.status(201).json(lab);
      
    } catch (error: any) {
       res.status(400).json({ error: error.message });
    }
  }

  // Get all labs
  async getAllLabs(req: Request, res: Response) {
    try {
      const labs = await labService.getAllLabs();
       res.status(200).json(labs);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  }

  // Get lab by ID
  async getLabById(req: Request, res: Response) {
    try {
      const lab = await labService.getLabById(req.params.id);
      if (!lab) {
         res.status(404).json({ error: "Lab not found" });
      }
       res.status(200).json(lab);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  }

  // Get labs by department
  async getLabsByDepartment(req: Request, res: Response) {
    try {
      const labs = await labService.getLabsByDepartment(req.params.departmentId);
       res.status(200).json(labs);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  }

  // Get labs by incharge
  async getLabsByIncharge(req: Request, res: Response) {
    try {
      const labs = await labService.getLabsByIncharge(req.params.inchargeId);
       res.status(200).json(labs);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  }

  // Update lab
  async updateLab(req: Request, res: Response) {
    try {
      const lab = await labService.updateLab(req.params.id, req.body);
       res.status(200).json(lab);
    } catch (error: any) {
       res.status(400).json({ error: error.message });
    }
  }

  // Delete lab
  async deleteLab(req: Request, res: Response) {
    try {
      const lab = await labService.deleteLab(req.params.id);
       res.status(200).json(lab);
    } catch (error: any) {
       res.status(400).json({ error: error.message });
    }
  }
}

export const labController = new LabController(); 