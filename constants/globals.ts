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
    FEES: '/dashboard/fees',
    EXAMS: '/dashboard/exams',
    ATTENDANCE: '/dashboard/attendance',
    MARKS: '/dashboard/marks',
    SETTINGS_CLASSES: '/settings/classes',
} as const;
