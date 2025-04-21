import { ApprovalStatus } from '@prisma/client';
import prisma from '../db/config.js';
/**
 * NotificationService for handling push notifications
 * throughout the OD request workflow
 */
export class NotificationService {
    /**
     * Send a push notification to a single user
     */
    async sendToUser(userId, title, body, data = {}) {
        try {
            // Get user's push token
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true }
            });
            if (!user?.pushToken) {
                console.log(`No push token found for user ${userId}`);
                return false;
            }
            // Send the notification
            return await this.sendNotification(user.pushToken, title, body, data);
        }
        catch (error) {
            console.error('Error sending notification to user:', error);
            return false;
        }
    }
    /**
     * Notify about a new OD request to the appropriate approver
     */
    async notifyNewRequest(requestId) {
        try {
            // Get request details with the first approver
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
                                where: { sequence: 0 }, // First step
                                include: { User: true }
                            }
                        }
                    }
                }
            });
            if (!request) {
                console.log(`Request ${requestId} not found`);
                return false;
            }
            // Get the initial approvers
            const initialApprovers = request.Approvals.flatMap(approval => approval.approvalSteps.map(step => step.User)).filter(Boolean);
            // Send notifications to each initial approver
            for (const approver of initialApprovers) {
                if (approver?.pushToken) {
                    await this.sendNotification(approver.pushToken, 'New OD Request', `${request.requestedBy.name || 'A student'} submitted a new OD request that needs your approval`, { requestId, type: 'new_request' });
                }
            }
            return true;
        }
        catch (error) {
            console.error('Error notifying about new request:', error);
            return false;
        }
    }
    /**
     * Notify about an OD request approval or rejection
     */
    async notifyRequestStatus(requestId, approvalStepId, approve) {
        try {
            // Get approval step details
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
                                                    user: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            approvalSteps: {
                                orderBy: { sequence: 'asc' },
                                include: {
                                    User: true
                                }
                            }
                        }
                    },
                    User: true
                }
            });
            if (!approvalStep) {
                console.log(`Approval step ${approvalStepId} not found`);
                return false;
            }
            const { approval } = approvalStep;
            const { request } = approval;
            // If approved, notify the next approver if there is one
            if (approve) {
                const nextStep = approval.approvalSteps.find(step => step.sequence === approvalStep.sequence + 1 && step.status === ApprovalStatus.PENDING);
                if (nextStep?.User?.pushToken) {
                    // Notify next approver
                    await this.sendNotification(nextStep.User.pushToken, 'OD Request Awaiting Approval', `An OD request approved by ${approvalStep.User?.name || 'a previous approver'} now requires your review`, { requestId, type: 'pending_approval' });
                }
                // Check if this was the final approval
                const allApproved = approval.approvalSteps.every(step => step.status === ApprovalStatus.APPROVED || step.sequence > approvalStep.sequence);
                if (allApproved) {
                    // Check if all group approvals are complete
                    const allApprovals = await prisma.approval.findMany({
                        where: { requestId: request.id }
                    });
                    const requestApproved = allApprovals.every(a => a.status === ApprovalStatus.APPROVED);
                    if (requestApproved) {
                        // Notify student that request is fully approved
                        await this.notifyRequestRequester(request.id, true);
                    }
                }
            }
            else {
                // Request was rejected, notify the student
                await this.notifyRequestRequester(request.id, false);
            }
            return true;
        }
        catch (error) {
            console.error('Error notifying about request status:', error);
            return false;
        }
    }
    /**
     * Notify the requester about final approval or rejection
     */
    async notifyRequestRequester(requestId, approved) {
        try {
            const request = await prisma.request.findUnique({
                where: { id: requestId },
                include: {
                    requestedBy: true,
                    students: {
                        include: {
                            student: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            });
            if (!request) {
                console.log(`Request ${requestId} not found`);
                return false;
            }
            // Get all students involved in the request
            const studentUsers = request.students.map(rs => rs.student.user).filter(Boolean);
            // Also notify the requester if they're not in the students list
            if (!studentUsers.find(u => u.id === request.requestedBy.id)) {
                studentUsers.push(request.requestedBy);
            }
            // Notify all students
            for (const user of studentUsers) {
                if (user.pushToken) {
                    await this.sendNotification(user.pushToken, approved ? 'OD Request Approved' : 'OD Request Rejected', approved
                        ? 'Your OD request has been fully approved'
                        : 'Your OD request was rejected', { requestId, type: approved ? 'approved' : 'rejected' });
                }
            }
            return true;
        }
        catch (error) {
            console.error('Error notifying requester:', error);
            return false;
        }
    }
    /**
     * Send a notification using Expo's push notification service
     */
    async sendNotification(pushToken, title, body, data = {}) {
        try {
            const message = {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data
            };
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message)
            });
            const result = await response.json();
            console.log('Push notification sent:', result);
            return result;
        }
        catch (error) {
            console.error('Error sending push notification:', error);
            return false;
        }
    }
}
