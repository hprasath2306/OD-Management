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
        console.log(`[Notification] Attempting to send notification to user ${userId}`);
        console.log(`[Notification] Title: "${title}", Body: "${body}", Data:`, data);
        try {
            // Get user's push token
            console.log(`[Notification] Fetching push token for user ${userId}`);
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true }
            });
            if (!user?.pushToken) {
                console.log(`[Notification] No push token found for user ${userId}`);
                return false;
            }
            console.log(`[Notification] Found push token for user ${userId}: ${user.pushToken.substring(0, 10)}...`);
            // Send the notification
            const result = await this.sendNotification(user.pushToken, title, body, data);
            console.log(`[Notification] Notification to user ${userId} ${result ? 'sent successfully' : 'failed'}`);
            return result;
        }
        catch (error) {
            console.error('[Notification] Error sending notification to user:', error);
            return false;
        }
    }
    /**
     * Notify about a new OD request to the appropriate approver
     */
    async notifyNewRequest(requestId) {
        console.log(`[Notification] Processing new request notification for request ${requestId}`);
        try {
            // Get request details with the first approver
            console.log(`[Notification] Fetching request details for ${requestId}`);
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
                console.log(`[Notification] Request ${requestId} not found`);
                return false;
            }
            console.log(`[Notification] Found request ${requestId} by ${request.requestedBy.name || 'unknown'}`);
            // Get the initial approvers
            const initialApprovers = request.Approvals.flatMap(approval => approval.approvalSteps.map(step => step.User)).filter(Boolean);
            console.log(`[Notification] Found ${initialApprovers.length} initial approvers for request ${requestId}`);
            // Log approver details for debugging
            initialApprovers.forEach((approver, index) => {
                console.log(`[Notification] Approver ${index + 1}: ${approver?.name || 'Unknown'} (${approver?.id || 'No ID'}), Has token: ${Boolean(approver?.pushToken)}`);
            });
            // Send notifications to each initial approver
            let successCount = 0;
            for (const approver of initialApprovers) {
                if (approver?.pushToken) {
                    console.log(`[Notification] Sending notification to approver ${approver.id} (${approver.name || 'Unknown'})`);
                    const success = await this.sendNotification(approver.pushToken, 'New OD Request', `${request.requestedBy.name || 'A student'} submitted a new OD request that needs your approval`, { requestId, type: 'new_request' });
                    if (success)
                        successCount++;
                    console.log(`[Notification] Notification to approver ${approver.id} ${success ? 'sent successfully' : 'failed'}`);
                }
                else {
                    console.log(`[Notification] Approver ${approver?.id || 'unknown'} has no push token, skipping notification`);
                }
            }
            console.log(`[Notification] Completed notifying approvers for request ${requestId}. ${successCount}/${initialApprovers.length} notifications sent successfully`);
            return true;
        }
        catch (error) {
            console.error('[Notification] Error notifying about new request:', error);
            return false;
        }
    }
    /**
     * Notify about an OD request approval or rejection
     */
    async notifyRequestStatus(requestId, approvalStepId, approve) {
        console.log(`[Notification] Processing ${approve ? 'approval' : 'rejection'} notification for request ${requestId}, step ${approvalStepId}`);
        try {
            // Get approval step details
            console.log(`[Notification] Fetching approval step details for ${approvalStepId}`);
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
                console.log(`[Notification] Approval step ${approvalStepId} not found`);
                return false;
            }
            console.log(`[Notification] Found approval step ${approvalStepId} by ${approvalStep.User?.name || 'unknown'}, sequence: ${approvalStep.sequence}`);
            const { approval } = approvalStep;
            const { request } = approval;
            // If approved, notify the next approver if there is one
            if (approve) {
                console.log(`[Notification] Processing approval notification flow`);
                const nextStep = approval.approvalSteps.find(step => step.sequence === approvalStep.sequence + 1 && step.status === ApprovalStatus.PENDING);
                if (nextStep) {
                    console.log(`[Notification] Found next approver: ${nextStep.User?.name || 'unknown'} (${nextStep.User?.id || 'No ID'}), Has token: ${Boolean(nextStep.User?.pushToken)}`);
                }
                else {
                    console.log(`[Notification] No next approver found in this approval chain`);
                }
                if (nextStep?.User?.pushToken) {
                    // Notify next approver
                    console.log(`[Notification] Sending notification to next approver ${nextStep.User.id}`);
                    const success = await this.sendNotification(nextStep.User.pushToken, 'OD Request Awaiting Approval', `An OD request approved by ${approvalStep.User?.name || 'a previous approver'} now requires your review`, { requestId, type: 'pending_approval' });
                    console.log(`[Notification] Notification to next approver ${nextStep.User.id} ${success ? 'sent successfully' : 'failed'}`);
                }
                // Check if this was the final approval
                const allApproved = approval.approvalSteps.every(step => step.status === ApprovalStatus.APPROVED || step.sequence > approvalStep.sequence);
                console.log(`[Notification] All steps in this approval chain approved: ${allApproved}`);
                if (allApproved) {
                    // Check if all group approvals are complete
                    console.log(`[Notification] Checking if all approval chains are complete for request ${requestId}`);
                    const allApprovals = await prisma.approval.findMany({
                        where: { requestId: request.id }
                    });
                    const requestApproved = allApprovals.every(a => a.status === ApprovalStatus.APPROVED);
                    console.log(`[Notification] All approval chains complete: ${requestApproved} (${allApprovals.length} chains)`);
                    if (requestApproved) {
                        // Notify student that request is fully approved
                        console.log(`[Notification] Request fully approved, notifying requester`);
                        await this.notifyRequestRequester(request.id, true);
                    }
                }
            }
            else {
                // Request was rejected, notify the student
                console.log(`[Notification] Request rejected, notifying requester`);
                await this.notifyRequestRequester(request.id, false);
            }
            console.log(`[Notification] Completed processing ${approve ? 'approval' : 'rejection'} notification for request ${requestId}`);
            return true;
        }
        catch (error) {
            console.error('[Notification] Error notifying about request status:', error);
            return false;
        }
    }
    /**
     * Notify the requester about final approval or rejection
     */
    async notifyRequestRequester(requestId, approved) {
        console.log(`[Notification] Notifying requester about ${approved ? 'approval' : 'rejection'} of request ${requestId}`);
        try {
            console.log(`[Notification] Fetching request details for ${requestId}`);
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
                console.log(`[Notification] Request ${requestId} not found`);
                return false;
            }
            console.log(`[Notification] Found request ${requestId} by ${request.requestedBy.name || 'unknown'}`);
            // Get all students involved in the request
            const studentUsers = request.students.map(rs => rs.student.user).filter(Boolean);
            console.log(`[Notification] Found ${studentUsers.length} students involved in request ${requestId}`);
            // Also notify the requester if they're not in the students list
            if (!studentUsers.find(u => u.id === request.requestedBy.id)) {
                console.log(`[Notification] Adding requester ${request.requestedBy.id} to notification list`);
                studentUsers.push(request.requestedBy);
            }
            // Log student details for debugging
            studentUsers.forEach((user, index) => {
                console.log(`[Notification] Student ${index + 1}: ${user.name || 'Unknown'} (${user.id || 'No ID'}), Has token: ${Boolean(user.pushToken)}`);
            });
            // Notify all students
            let successCount = 0;
            for (const user of studentUsers) {
                if (user.pushToken) {
                    console.log(`[Notification] Sending ${approved ? 'approval' : 'rejection'} notification to student ${user.id}`);
                    const success = await this.sendNotification(user.pushToken, approved ? 'OD Request Approved' : 'OD Request Rejected', approved
                        ? 'Your OD request has been fully approved'
                        : 'Your OD request was rejected', { requestId, type: approved ? 'approved' : 'rejected' });
                    if (success)
                        successCount++;
                    console.log(`[Notification] Notification to student ${user.id} ${success ? 'sent successfully' : 'failed'}`);
                }
                else {
                    console.log(`[Notification] Student ${user.id} has no push token, skipping notification`);
                }
            }
            console.log(`[Notification] Completed notifying students about request ${requestId}. ${successCount}/${studentUsers.length} notifications sent successfully`);
            return true;
        }
        catch (error) {
            console.error('[Notification] Error notifying requester:', error);
            return false;
        }
    }
    /**
     * Send a notification using Expo's push notification service
     */
    async sendNotification(pushToken, title, body, data = {}) {
        console.log(`[Notification] Sending push notification`);
        console.log(`[Notification] Token: ${pushToken.substring(0, 10)}...`);
        console.log(`[Notification] Title: "${title}", Body: "${body}"`);
        console.log(`[Notification] Data:`, data);
        try {
            const message = {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data
            };
            console.log(`[Notification] Calling Expo push service`);
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
            console.log('[Notification] Push notification response:', result);
            // Check for errors in the response
            if (result.data && result.data.status && result.data.status === 'error') {
                console.error(`[Notification] Push service reported error:`, result.data.message);
                return false;
            }
            return result;
        }
        catch (error) {
            console.error('[Notification] Error sending push notification:', error);
            return false;
        }
    }
}
