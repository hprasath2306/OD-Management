import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';


export const validateResource = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // // Validate request against schema
      console.log("req.body:", req.body);
      // console.log("Type of teacherId:", typeof req.body.teacherId);
      // console.log("Type of designationId:", typeof req.body.designationId); 
      // console.log(req.body)
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });


      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
        });

      }

      next(error);
    }
  };
};