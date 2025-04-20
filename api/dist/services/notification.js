import { Expo } from 'expo-server-sdk';
import { PrismaClient, ApprovalStatus } from '@prisma/client';
const prisma = new PrismaClient();
const expo = new Expo();
export class NotificationService {
    // Send notification to a single user
    async sendToUser(userId, title, body, data = {}) {
        try {
            // Get user's push token
            // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true }
            });
            if (!user?.pushToken) {
                console.log(`No push token found for user ${userId}`);
                return false;
            }
            // Validate the token
            if (!Expo.isExpoPushToken(user.pushToken)) {
                console.error(`Invalid Expo push token ${user.pushToken} for user ${userId}`);
                return false;
            }
            // Prepare message
            const message = {
                to: user.pushToken,
                sound: 'default',
                title,
                body,
                data,
            };
            // Send notification
            return await this.sendNotifications([message]);
        }
        catch (error) {
            console.error('Error sending notification to user:', error);
            return false;
        }
    }
    // Send notification to multiple users
    async sendToUsers(userIds, title, body, data = {}) {
        try {
            // Get users' push tokens
            // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, pushToken: true }
            });
            const messages = [];
            // Prepare messages for each user with a valid token
            for (const user of users) {
                if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
                    messages.push({
                        to: user.pushToken,
                        sound: 'default',
                        title,
                        body,
                        data,
                    });
                }
                else {
                    console.log(`Skipping notification for user ${user.id} - invalid or missing token`);
                }
            }
            if (messages.length === 0) {
                console.log('No valid push tokens found for the specified users');
                return false;
            }
            // Send notifications
            return await this.sendNotifications(messages);
        }
        catch (error) {
            console.error('Error sending notifications to users:', error);
            return false;
        }
    }
    // Send notifications to all users with a specific role
    async sendToRole(role, title, body, data = {}) {
        try {
            // Get all users with the specified role who have push tokens
            // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
            const users = await prisma.user.findMany({
                where: {
                    role,
                    // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
                    pushToken: { not: null }
                },
                select: { id: true, pushToken: true }
            });
            const messages = [];
            // Prepare messages for each user with a valid token
            for (const user of users) {
                if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
                    messages.push({
                        to: user.pushToken,
                        sound: 'default',
                        title,
                        body,
                        data,
                    });
                }
            }
            if (messages.length === 0) {
                console.log(`No valid push tokens found for users with role ${role}`);
                return false;
            }
            // Send notifications
            return await this.sendNotifications(messages);
        }
        catch (error) {
            console.error(`Error sending notifications to users with role ${role}:`, error);
            return false;
        }
    }
    // Send notification to approvers for a specific request
    async notifyApprovers(requestId, title, body) {
        try {
            // Find the current approval steps for the request
            const approvalSteps = await prisma.approvalStep.findMany({
                where: {
                    approval: { requestId },
                    status: ApprovalStatus.PENDING,
                },
                include: {
                    // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
                    User: {
                        select: { id: true, pushToken: true }
                    }
                }
            });
            if (approvalSteps.length === 0) {
                console.log(`No pending approval steps found for request ${requestId}`);
                return false;
            }
            const messages = [];
            // Prepare messages for each approver with a valid token
            for (const step of approvalSteps) {
                const user = step.User;
                if (user?.pushToken && Expo.isExpoPushToken(user.pushToken)) {
                    messages.push({
                        to: user.pushToken,
                        sound: 'default',
                        title,
                        body,
                        data: { requestId, approvalStepId: step.id },
                    });
                }
            }
            if (messages.length === 0) {
                console.log(`No valid push tokens found for approvers of request ${requestId}`);
                return false;
            }
            // Send notifications
            return await this.sendNotifications(messages);
        }
        catch (error) {
            console.error(`Error sending notifications to approvers for request ${requestId}:`, error);
            return false;
        }
    }
    // Notify about new OD request
    async notifyNewRequest(requestId) {
        try {
            // Get request details
            const request = await prisma.request.findUnique({
                where: { id: requestId },
                include: {
                    requestedBy: true,
                    students: {
                        include: {
                            student: {
                                include: {
                                    group: true
                                }
                            }
                        }
                    },
                    Approvals: {
                        include: {
                            approvalSteps: {
                                where: { sequence: 0 },
                                // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
                                include: { User: { select: { id: true, name: true, pushToken: true } } }
                            }
                        }
                    }
                }
            });
            if (!request) {
                console.log(`Request ${requestId} not found`);
                return false;
            }
            // Get the initial approvers for each group
            const initialApprovers = request.Approvals.flatMap(approval => approval.approvalSteps.map(step => step.User));
            // Prepare messages for each approver with a valid token
            const messages = [];
            for (const approver of initialApprovers) {
                if (approver?.pushToken && Expo.isExpoPushToken(approver.pushToken)) {
                    messages.push({
                        to: approver.pushToken,
                        sound: 'default',
                        channelId: 'new-requests',
                        title: 'New OD Request',
                        body: `${request.requestedBy.name} has submitted a new OD request for approval`,
                        data: { requestId, type: 'new-request' },
                    });
                }
            }
            if (messages.length === 0) {
                console.log(`No valid push tokens found for approvers of new request ${requestId}`);
                return false;
            }
            // Send notifications
            return await this.sendNotifications(messages);
        }
        catch (error) {
            console.error(`Error sending notifications for new request ${requestId}:`, error);
            return false;
        }
    }
    // Notify about request approval
    async notifyRequestApproval(requestId, approvalStepId, approve) {
        try {
            // Get approval step and related information
            const approvalStep = await prisma.approvalStep.findUnique({
                where: { id: approvalStepId },
                include: {
                    approval: {
                        include: {
                            request: {
                                include: {
                                    requestedBy: true,
                                    students: {
                                        include: {
                                            student: {
                                                include: {
                                                    // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
                                                    user: { select: { id: true, name: true, pushToken: true } }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            approvalSteps: {
                                orderBy: { sequence: 'asc' },
                                // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
                                include: {
                                    User: { select: { id: true, name: true, pushToken: true } }
                                }
                            }
                        }
                    },
                    // @ts-ignore - pushToken exists in the schema but TypeScript doesn't recognize it
                    User: { select: { id: true, name: true, pushToken: true } }
                }
            });
            if (!approvalStep) {
                console.log(`Approval step ${approvalStepId} not found`);
                return false;
            }
            const { approval } = approvalStep;
            const { request } = approval;
            // Prepare notifications based on approval status
            if (approve) {
                // If approved, check if there are next approvers to notify
                const nextStep = approval.approvalSteps.find(step => step.sequence === approvalStep.sequence + 1 && step.status === ApprovalStatus.PENDING);
                if (nextStep?.User?.pushToken && Expo.isExpoPushToken(nextStep.User.pushToken)) {
                    // Notify next approver
                    const message = {
                        to: nextStep.User.pushToken,
                        sound: 'default',
                        channelId: 'approvals',
                        title: 'OD Request Awaiting Your Approval',
                        // @ts-ignore - User may be null, handled with OR condition
                        body: `An OD request approved by ${approvalStep.User?.name || 'a previous approver'} now requires your attention`,
                        data: { requestId, type: 'pending-approval' },
                    };
                    await this.sendNotifications([message]);
                }
                // If this was the final approval in the flow, notify the student
                if (!nextStep && approval.status === ApprovalStatus.APPROVED) {
                    // Get all student users in this request
                    const studentUsers = request.students.map(rs => rs.student.user);
                    // Send notifications to students with valid tokens
                    const studentMessages = studentUsers
                        .filter(user => user.pushToken && Expo.isExpoPushToken(user.pushToken))
                        .map(user => ({
                        to: user.pushToken,
                        sound: 'default',
                        channelId: 'approvals',
                        title: 'OD Request Approved',
                        body: `Your OD request has been fully approved`,
                        data: { requestId, type: 'approved' },
                    }));
                    if (studentMessages.length > 0) {
                        await this.sendNotifications(studentMessages);
                    }
                }
            }
            else {
                // If rejected, notify the student
                const studentUsers = request.students.map(rs => rs.student.user);
                // Send notifications to students with valid tokens
                const studentMessages = studentUsers
                    .filter(user => user.pushToken && Expo.isExpoPushToken(user.pushToken))
                    .map(user => ({
                    to: user.pushToken,
                    sound: 'default',
                    channelId: 'rejections',
                    title: 'OD Request Rejected',
                    // @ts-ignore - User may be null, handled with OR condition
                    body: `Your OD request was rejected by ${approvalStep.User?.name || 'an approver'}`,
                    data: { requestId, type: 'rejected' },
                }));
                if (studentMessages.length > 0) {
                    await this.sendNotifications(studentMessages);
                }
            }
            return true;
        }
        catch (error) {
            console.error(`Error sending notifications for request approval ${requestId}:`, error);
            return false;
        }
    }
    // Helper to send notifications through Expo
    async sendNotifications(messages) {
        try {
            // Chunk the messages (Expo accepts a maximum of 100 messages per request)
            const chunks = expo.chunkPushNotifications(messages);
            // Send the chunks
            const tickets = [];
            for (const chunk of chunks) {
                try {
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    tickets.push(...ticketChunk);
                    console.log('Push notification sent:', ticketChunk);
                }
                catch (error) {
                    console.error('Error sending push notification chunk:', error);
                }
            }
            return tickets;
        }
        catch (error) {
            console.error('Error sending push notifications:', error);
            return false;
        }
    }
}
export const notificationService = new NotificationService();
