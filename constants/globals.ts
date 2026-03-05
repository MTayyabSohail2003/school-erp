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
    FEE_STRUCTURES: '/dashboard/finance/structures',
    CHALLANS: '/dashboard/finance/challans',
    DEFAULTERS: '/dashboard/finance/defaulters',
    PAYROLL: '/dashboard/payroll',
    EXAMS: '/dashboard/exams',
    ATTENDANCE: '/dashboard/attendance',
    MARKS: '/dashboard/marks',
    SETTINGS_CLASSES: '/settings/classes',
    NOTICE_BOARD: '/dashboard/notices',
} as const;
