import { type NotificationType } from '@/features/notifications/api/use-notifications';
import { ROUTES } from '@/constants/globals';

export interface NotificationTemplate {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}

export const NotificationTemplates = {
    // ---- LEAVE REQUESTS ----
    LEAVE_REQUEST_SUBMITTED: (studentName: string): NotificationTemplate => ({
        title: 'New Leave Request',
        message: `A new leave request has been submitted for ${studentName}.`,
        type: 'INFO',
        link: '/dashboard/attendance/leaves',
    }),

    LEAVE_REQUEST_APPROVED: (studentName: string): NotificationTemplate => ({
        title: 'Leave Request Approved',
        message: `The leave request for ${studentName} has been approved ✅.`,
        type: 'SUCCESS',
        link: '/dashboard/attendance/leaves',
    }),

    LEAVE_REQUEST_REJECTED: (studentName: string): NotificationTemplate => ({
        title: 'Leave Request Rejected',
        message: `The leave request for ${studentName} has been rejected ❌.`,
        type: 'ERROR',
        link: '/dashboard/attendance/leaves',
    }),

    // ---- ATTENDANCE ----
    STUDENT_ABSENT: (studentName: string, date: string): NotificationTemplate => ({
        title: 'Student Marked Absent',
        message: `${studentName} was marked absent on ${date}.`,
        type: 'WARNING',
        link: '/dashboard/attendance',
    }),

    // ---- FEES & ACCOUNTS ----
    FEE_CHALLAN_GENERATED: (month: string): NotificationTemplate => ({
        title: 'New Fee Challan',
        message: `Fee challan for ${month} has been generated.`,
        type: 'INFO',
        link: ROUTES.FEE,
    }),

    FEE_RECEIVED: (studentName: string, amount: number): NotificationTemplate => ({
        title: 'Fee Payment Received',
        message: `Payment of Rs. ${amount} received for ${studentName}.`,
        type: 'SUCCESS',
        link: ROUTES.FEE,
    }),

    // ---- GENERAL ----
    NEW_NOTICE: (noticeTitle: string): NotificationTemplate => ({
        title: 'New Announcement',
        message: noticeTitle,
        type: 'INFO',
        link: '/dashboard/communication/notices',
    }),
} as const;
