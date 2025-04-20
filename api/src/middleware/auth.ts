import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import prisma from "../db/config.js";
import { verifyToken } from "../utils/jwt.js";

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: "Unauthenticated" });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true }
        });

        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        res.locals.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const currentUser = async (req: Request): Promise<User | null> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return null;
        }

        return await prisma.user.findUnique({
            where: { id: decoded.id }
        });
    } catch (error) {
        console.error('Current user error:', error);
        return null;
    }
};