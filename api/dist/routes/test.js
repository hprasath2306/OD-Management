import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { notificationService } from "../services/index.js";
const router = Router();
// Test route for sending push notifications
router.post('/push-notification', authMiddleware, async (req, res) => {
    try {
        const { to, title, body, data } = req.body;
        // Validate input
        if (!to) {
            return res.status(400).json({ error: 'Recipient token is required' });
        }
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }
        // Send notification directly using Expo's push service
        const result = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                title,
                body,
                data: data || {},
                sound: 'default'
            })
        });
        const responseData = await result.json();
        return res.status(200).json({
            message: 'Push notification sent',
            response: responseData
        });
    }
    catch (error) {
        console.error('Error sending test notification:', error);
        return res.status(500).json({
            error: 'Failed to send notification',
            details: error.message
        });
    }
});
// Test route for sending a notification to the current user
router.post('/notify-me', authMiddleware, async (req, res) => {
    try {
        const { title, body, data } = req.body;
        const userId = res.locals.user.id;
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }
        const result = await notificationService.sendToUser(userId, title, body, data || {});
        if (result) {
            return res.status(200).json({ message: 'Notification sent to your device' });
        }
        else {
            return res.status(400).json({ error: 'Failed to send notification. You may not have a push token registered.' });
        }
    }
    catch (error) {
        console.error('Error sending notification to user:', error);
        return res.status(500).json({
            error: 'Failed to send notification',
            details: error.message
        });
    }
});
export default router;
