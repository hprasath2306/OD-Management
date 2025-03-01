import { Request, Response, NextFunction } from "express";
import { lucia } from "../utils/lucia";
import { User } from "@prisma/client/default";
import prisma from "../db/config";


export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const auth = req.headers.authorization;
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? auth ?? "");
    // If the session ID is not present, the user is not logged in.
    if (!sessionId) {
        res.locals.user = null;
        res.locals.session = null;
        res.locals.bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        res.status(401).json({ message: "Unauthenticated" });
        return;
    }
    // If the session ID is present, the user is logged in.
    const { session, user } = await lucia.validateSession(sessionId);
    // If the session is fresh, a new session cookie is created and sent to the client.
    if (session && session.fresh) {
        res.appendHeader(
            "Set-Cookie",
            lucia.createSessionCookie(session.id).serialize()
        );
    }
    // If the session is not fresh, the session cookie is updated with the new expiry time.
    if (!session) {
        res.appendHeader(
            "Set-Cookie",
            lucia.createBlankSessionCookie().serialize()
        );
    }

    res.locals.session = session;
    res.locals.user = user;
    res.locals.bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    next();
};

export const currentUser = async (
    req: Request
): Promise<User | null> => {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
    if (!sessionId) {
        return null;
    }
    const { user } = await lucia.validateSession(sessionId);

    const userObj = user
        ? await prisma.user.findUnique({
            where: {
                id: user.id,
            },
        })
        : null;
    return userObj;
};