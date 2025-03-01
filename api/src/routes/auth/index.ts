import { Router } from "express";
import randomstring from "randomstring";
import { getUser } from "../../utils/getUser";
import { Argon2id } from "oslo/password";
import prisma from "../../db/config";
import { sendEmail } from "../../utils/sendEmail";
import { randomBytes } from "crypto";
import { lucia } from "../../utils/lucia";
import { authMiddleware, currentUser } from "../../middleware/auth";
import { createUser } from "../../utils/createUser";


const router = Router();

// Generate OTP
function generateOTP() {
    return randomstring.generate({
        length: 6,
        charset: "numeric",
    });
}

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        const user = await getUser(username);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isValidPassword = await new Argon2id().verify(
            user.password!,
            password
        );
        if (isValidPassword) {
            if (!user.emailVerified) {
                // send email verification mail
                let optVerification = await prisma.otp.findFirst({
                    where: {
                        email: user.username || user.email!,
                    },
                });

                const otp = generateOTP();
                if (optVerification) {
                    optVerification = await prisma.otp.upsert({
                        where: { id: optVerification.id },
                        update: {
                            expires: new Date(Date.now() + 1000 * 60 * 5),
                            otp,
                        },
                        create: {
                            expires: new Date(Date.now() + 1000 * 60 * 5),
                            otp,
                            email: user.username || user.email!,
                        },
                    });
                }
                // send email
                sendEmail({
                    to: user.username || user.email!,
                    subject: "Email Verification",
                    message: `Your OTP is ${otp} to verify your email. will expire 5 mins`,
                });
                return res
                    .status(403)
                    .json({ message: "Email not verified, mail has been sent" });
            }
            const sessionId = randomBytes(12).toString("hex");
            const session = await lucia.createSession(user.id, {}, { sessionId });
            const sessionCookie = lucia.createSessionCookie(session.id);
            res.appendHeader("Set-Cookie", sessionCookie.serialize());
            const sessionUser = {
                id: user.id,
                email: user.email || user.username,
                role: user.role
            }
            return res.status(201).json({ session: session, user: sessionUser });
        } else {
            return res.status(401).json({ message: "Invalid username or password" });
        }
    } catch (error: any) {
        console.log(error.message);
        return error(500, "Internal server error");
    }
});

router.post("/verifyEmail", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ message: "Invalid email or otp" });
            return;
        }
        const optVerification = await prisma.otp.findUnique({
            where: {
                email,
                otp,
            },
        });
        if (!optVerification) {
            res.status(401).json({ message: "Invalid OTP" });
            return;
        }

        await prisma.otp.delete({
            where: {
                email,
                otp,
            },
        });
        if (optVerification.expires < new Date()) {
            res.status(401).json({ message: "OTP expired" });
            return;
        }
        const user = await prisma.user.update({
            where: { email },
            data: {
                emailVerified: new Date(),
            },
        });
        const sessionId = randomBytes(12).toString("hex");
        const session = await lucia.createSession(user.id, {}, { sessionId });
        const sessionCookie = lucia.createSessionCookie(session.id)
        res.appendHeader("Set-Cookie", sessionCookie.serialize());
        res
            .status(201)
            .json({ session: session, user: user, message: "Email verified" });
        return;
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.post("/forgotPassword", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: "Invalid email" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const otp = generateOTP();
        const expires = new Date(Date.now() + 1000 * 60 * 5);

        const optVerification = await prisma.otp.upsert({
            where: { email }, // Use email as a unique identifier for simplicity
            update: {
                otp,
                expires,
                verifiedAt: null,
            },
            create: {
                email,
                otp,
                expires,
            },
        });

        // send email
        sendEmail({
            to: email,
            subject: "Reset Password",
            message: `Your OTP is ${otp} to reset your password. will expire 5 mins`,
        });
        res.status(200).json({ message: "Mail has been sent" });
        return;
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.post("/verifyForgotPassword", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ message: "Invalid email or otp" });
            return;
        }
        let optVerification = await prisma.otp.findUnique({
            where: {
                email,
                otp,
            },
        });
        if (!optVerification) {
            res.status(401).json({ message: "Invalid OTP" });
            return;
        }

        optVerification = await prisma.otp.update({
            where: {
                email,
                otp,
            },
            data: {
                verifiedAt: new Date(),
            },
        });
        if (optVerification.expires < new Date()) {
            res.status(401).json({ message: "OTP expired" });
            return;
        }
        res.status(200).json({ message: "OTP verified" });
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.post("/resetPassword", async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            res.status(400).json({ message: "Invalid email, otp or password" });
            return;
        }
        const optVerification = await prisma.otp.findUnique({
            where: {
                email,
                otp,
            },
        });
        if (!optVerification) {
            res.status(401).json({ message: "Invalid OTP" });
            return;
        }

        await prisma.otp.delete({
            where: {
                email,
                otp,
            },
        });
        if (!optVerification.verifiedAt) {
            res.status(401).json({ message: "OTP not verified" });
            return;
        }
        const hashedPassword = await new Argon2id().hash(password);
        const user = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                emailVerified: new Date(),
            },
        });
        res.status(201).json({ user, message: "Password reset successfully" });
        return;
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.post("/changePassword", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        console.log("CHANGE PASSWORD", oldPassword, newPassword);
        if (!oldPassword || !newPassword) {
            res.status(400).json({ message: "Invalid old password or new password" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: res.locals.user.id },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const isValidPassword = await new Argon2id().verify(
            user.password!,
            oldPassword
        );
        if (!isValidPassword) {
            res.status(401).json({ message: "Invalid old password" });
            return;
        }
        const hashedPassword = await new Argon2id().hash(newPassword);
        await prisma.user.update({
            where: { id: res.locals.user.id },
            data: {
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: "Password changed successfully" });
        return;
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.post("/signup", async (req, res) => {
    try {
        const body = req.body;

        const { username, password } = body;
        if (!username || !password) {
            res.status(400).json({ message: "Invalid username or password" });
            return;
        }
        if (await getUser(username)) {
            console.log("Username already exists");
            res.status(400).json({ message: "Username already exists" });
            return;
        }
        const hashedPassword = await new Argon2id().hash(password);

        const user =
            (await getUser(username)) ||
            (await createUser(username, hashedPassword, "STUDENT"));

        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const sessionId = randomBytes(12).toString("hex");
        const session = await lucia.createSession(
            user.id,
            {},
            {
                sessionId,
            }
        );
        const sessionCookie = lucia.createSessionCookie(session.id);
        res.appendHeader("Set-Cookie", sessionCookie.serialize());
        res.status(200);
        res.json({ session: session.id, user: user.id });
        return;
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.post("/logout", authMiddleware, async (req, res) => {
    try {
        if (!res.locals.session) {
            res.status(401).json({ message: "Unauthenticated" });
            return;
        }
        await lucia.invalidateSession(res.locals.session.id);
        res.appendHeader(
            "Set-Cookie",
            lucia.createBlankSessionCookie().serialize()
        );
        res.status(200).json({ message: "Logged out" });
    } catch (err: any) {
        console.log(err.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        if (!res.locals.user) {
            res.status(401).json({ message: "Unauthenticated" });
        }
        res.json({ user: res.locals.user });
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.get("/currentUser", async (req, res) => {
    try {
        res.json({ user: await currentUser(req) });
        return;
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});


export default router;
