import { Router } from "express";
import randomstring from "randomstring";
import { getUser } from "../../utils/getUser.js";
import { Argon2id } from "oslo/password";
import prisma from "../../db/config.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { randomBytes } from "crypto";
import { lucia } from "../../utils/lucia.js";
import { authMiddleware, currentUser } from "../../middleware/auth.js";
import { createUser } from "../../utils/createUser.js";
import { UserRole } from "@prisma/client";

const router = Router();

// Generate OTP
function generateOTP() {
    return randomstring.generate({ length: 6, charset: "numeric" });
}

// ✅ LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const user = await getUser(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValidPassword = await new Argon2id().verify(user.password, password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Email verification check
        if (!user.emailVerified) {
            const otp = generateOTP();
            await prisma.oTP.upsert({
                where: { email },
                update: { expiresAt: new Date(Date.now() + 1000 * 60 * 5), otp },
                create: { email, expiresAt: new Date(Date.now() + 1000 * 60 * 5), otp },
            });

            sendEmail({
                to: email,
                subject: "Email Verification",
                message: `Your OTP is ${otp}. It will expire in 5 minutes.`,
            });

            return res.status(403).json({ message: "Email not verified, verification OTP sent" });
        }

        const session = await lucia.createSession(user.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        res.appendHeader("Set-Cookie", sessionCookie.serialize());

        return res.status(201).json({ session, user: { id: user.id, email, role: user.role } });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ EMAIL VERIFICATION
router.post("/verifyEmail", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Invalid email or OTP" });
        }

        const optVerification = await prisma.oTP.findFirst({ where: { email, otp } });
        if (!optVerification || optVerification.expiresAt < new Date()) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        await prisma.oTP.delete({ where: { id: optVerification.id } });

        const user = await prisma.user.update({
            where: { email },
            data: { emailVerified: true },
        });

        const session = await lucia.createSession(user.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        res.appendHeader("Set-Cookie", sessionCookie.serialize());

        return res.status(201).json({ session, user, message: "Email verified" });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ FORGOT PASSWORD (REQUEST OTP)
router.post("/forgotPassword", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Invalid email" });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = generateOTP();
        await prisma.oTP.upsert({
            where: { email },
            update: { otp, expiresAt: new Date(Date.now() + 1000 * 60 * 5) },
            create: { email, otp, expiresAt: new Date(Date.now() + 1000 * 60 * 5) },
        });

        sendEmail({ to: email, subject: "Reset Password", message: `Your OTP is ${otp}.` });

        return res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ RESET PASSWORD
router.post("/resetPassword", async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) return res.status(400).json({ message: "Missing fields" });

        const optVerification = await prisma.oTP.findFirst({ where: { email, otp } });
        if (!optVerification || optVerification.expiresAt < new Date()) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        await prisma.oTP.delete({ where: { id: optVerification.id } });

        const hashedPassword = await new Argon2id().hash(password);
        await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

        return res.status(201).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ CHANGE PASSWORD
router.post("/changePassword", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) return res.status(400).json({ message: "Invalid request" });

        const user = await prisma.user.findUnique({ where: { id: res.locals.user.id } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isValidPassword = await new Argon2id().verify(user.password, oldPassword);
        if (!isValidPassword) return res.status(401).json({ message: "Invalid old password" });

        const hashedPassword = await new Argon2id().hash(newPassword);
        await prisma.user.update({ where: { id: res.locals.user.id }, data: { password: hashedPassword } });

        return res.status(201).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ LOGOUT
router.post("/logout", authMiddleware, async (req, res) => {
    try {
        await lucia.invalidateSession(res.locals.session.id);
        res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
        return res.status(200).json({ message: "Logged out" });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ GET USER PROFILE
router.get("/profile", authMiddleware, (req, res) => {
    return res.json({ user: res.locals.user });
});

// ✅ GET CURRENT USER
router.get("/currentUser", async (req, res) => {
    return res.json({ user: await currentUser(req) });
});

export default router;
