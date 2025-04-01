import { lucia } from "../utils/lucia.js";
import prisma from "../db/config.js";
export const authMiddleware = async (req, res, next) => {
    const auth = req.headers.authorization;
    // console.log("auth", auth);
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? auth ?? "");
    console.log("sessionId", sessionId);
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
        res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    }
    // If the session is not fresh, the session cookie is updated with the new expiry time.
    if (!session) {
        res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    }
    if (user) {
        // Fetch user from database to include role
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, email: true, role: true }, // Ensure role is selected
        });
        // console.log("dbUser",dbUser);
        res.locals.user = dbUser;
    }
    else {
        res.locals.user = null;
    }
    res.locals.session = session;
    res.locals.bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    next();
};
export const currentUser = async (req) => {
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
