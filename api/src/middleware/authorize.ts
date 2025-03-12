import { Request, Response, NextFunction } from 'express';

import { UserRole } from '@prisma/client';


// Define a custom interface to extend Express Request
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      role: UserRole;
      // add other user properties you need
    };
  }
}

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists (should be set by authenticate middleware)
      // console.log(req.)
      console.log(res.locals.user);
      if (!res.locals.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login to access this resource',
        });
        return;
      }


     
      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(res.locals.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden - You do not have permission to access this resource',
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};