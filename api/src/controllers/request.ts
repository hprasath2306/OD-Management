import { Request, Response } from "express";
import { requestService } from "../services/request";

export class RequestController {
  // Create a new request
  async createRequest(req: Request, res: Response) {
    try {
      const request = await requestService.createRequest({
        ...req.body,
        requestedById: res.locals.id, // From auth middleware
      });
      res.status(201).json(request); 
      return

    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return
    }
  }


}


export const requestController = new RequestController(); 