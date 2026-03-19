export const ROLES = {
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
    PARENT: 'PARENT',
} as const;

export type Role = keyof typeof ROLES;

export const ROUTES = {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    STUDENTS: '/dashboard/students',
    STAFF: '/dashboard/staff',
    DEFAULTERS: '/dashboard/finance/defaulters',
    PAYROLL: '/dashboard/payroll',
    EXAMS: '/dashboard/exams',
    ATTENDANCE: '/dashboard/attendance',
    MARKS: '/dashboard/marks',
    SETTINGS_CLASSES: '/settings/classes',
    NOTICE_BOARD: '/settings/notices',           // admin notice board
    TEACHER_NOTICE_BOARD: '/dashboard/notice-board', // teacher notice board
    PARENT_NOTICE_BOARD: '/parent/notice-board',     // parent notice board
    FEE: '/dashboard/fees',
} as const;
