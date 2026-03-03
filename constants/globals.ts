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
    FEES: '/dashboard/fees',
    EXAMS: '/dashboard/exams',
} as const;
