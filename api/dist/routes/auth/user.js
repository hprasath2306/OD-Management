import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { PrismaClient } from "@prisma/client";
const router = Router();
const prisma = new PrismaClient();
// Register push token
router.post('/push-token', authMiddleware, async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = res.locals.user.id;
        if (!pushToken) {
            return res.status(400).json({ error: 'Push token is required' });
        }
        // Update user with push token
        await prisma.user.update({
            where: { id: userId },
            data: { pushToken }
        });
        res.status(200).json({ message: 'Push token registered successfully' });
    }
    catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({ error: 'Failed to register push token' });
    }
});
// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = res.locals.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                phone: true,
                pushToken: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});
export default router;
