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

    // ---- ACADEMICS ----
    EXAM_SCHEDULED: (examName: string): NotificationTemplate => ({
        title: 'New Exam Scheduled',
        message: `${examName} has been scheduled. Check the date sheet for details.`,
        type: 'INFO',
        link: ROUTES.EXAMS,
    }),

    REPORT_CARD_PUBLISHED: (studentName: string): NotificationTemplate => ({
        title: 'Report Card Published',
        message: `The academic report card for ${studentName} is now available.`,
        type: 'SUCCESS',
        link: '/dashboard/marks',
    }),

    CLASS_ASSIGNED: (className: string): NotificationTemplate => ({
        title: 'New Class Assigned',
        message: `You have been assigned as a teacher for ${className}.`,
        type: 'SUCCESS',
        link: ROUTES.DASHBOARD,
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

    PAYROLL_PROCESSED: (month: string): NotificationTemplate => ({
        title: 'Salary Disbursed',
        message: `Your salary for ${month} has been processed and disbursed.`,
        type: 'SUCCESS',
        link: ROUTES.DASHBOARD,
    }),

    // ---- REGISTRATION ----
    NEW_STAFF_REGISTERED: (staffName: string): NotificationTemplate => ({
        title: 'New Staff Registered',
        message: `${staffName} has joined the school as a new staff member.`,
        type: 'SUCCESS',
        link: ROUTES.STAFF,
    }),

    NEW_STUDENT_REGISTERED: (studentName: string): NotificationTemplate => ({
        title: 'New Student Registered',
        message: `${studentName} has been successfully registered in the system.`,
        type: 'SUCCESS',
        link: ROUTES.STUDENTS,
    }),

    // ---- GENERAL ----
    NEW_NOTICE: (noticeTitle: string): NotificationTemplate => ({
        title: 'New Announcement',
        message: noticeTitle,
        type: 'INFO',
        link: ROUTES.NOTICE_BOARD,
    }),

    // ---- NOTICE BOARD ----
    NOTICE_POSTED_TEACHER: (noticeTitle: string): NotificationTemplate => ({
        title: '📢 New Notice — Teachers',
        message: `Admin posted a new notice: "${noticeTitle}". Tap to view the notice board.`,
        type: 'INFO',
        link: ROUTES.TEACHER_NOTICE_BOARD,
    }),

    NOTICE_POSTED_PARENT: (noticeTitle: string): NotificationTemplate => ({
        title: '📢 New Notice — Parents',
        message: `A new school announcement has been posted: "${noticeTitle}". Tap to view.`,
        type: 'INFO',
        link: ROUTES.PARENT_NOTICE_BOARD,
    }),

    LEAVE_SUMMARY_POSTED: (date: string, total: number): NotificationTemplate => ({
        title: '📋 Daily Leave Summary',
        message: `Leave summary for ${date} has been posted. ${total} request(s) processed today.`,
        type: 'INFO',
        link: ROUTES.TEACHER_NOTICE_BOARD,
    }),
} as const;
