import { useQuery } from '@tanstack/react-query';
import { studentHistoryApi } from '../api/student-history.api';

// Centralized query keys for student history
export const studentHistoryKeys = {
    all: ['student-history'] as const,
    promotions: (studentId: string) => [...studentHistoryKeys.all, 'promotions', studentId] as const,
    attendance: (studentId: string) => [...studentHistoryKeys.all, 'attendance', studentId] as const,
    fees: (studentId: string) => [...studentHistoryKeys.all, 'fees', studentId] as const,
};

/**
 * Fetch promotion timeline for a student
 */
export function usePromotionHistory(studentId: string) {
    return useQuery({
        queryKey: studentHistoryKeys.promotions(studentId),
        queryFn: () => studentHistoryApi.getPromotionHistory(studentId),
        enabled: Boolean(studentId),
    });
}

/**
 * Fetch student enrollment info for timeline baseline
 */
export function useStudentEnrollment(studentId: string) {
    return useQuery({
        queryKey: [...studentHistoryKeys.all, 'enrollment', studentId] as const,
        queryFn: () => studentHistoryApi.getStudentEnrollment(studentId),
        enabled: Boolean(studentId),
    });
}

/**
 * Fetch attendance history for a student, summarized by month
 */
export function useAttendanceHistory(studentId: string) {
    return useQuery({
        queryKey: studentHistoryKeys.attendance(studentId),
        queryFn: () => studentHistoryApi.getAttendanceHistory(studentId),
        enabled: Boolean(studentId),
    });
}

/**
 * Fetch complete fee ledger for a student
 */
export function useFeeHistory(studentId: string) {
    return useQuery({
        queryKey: studentHistoryKeys.fees(studentId),
        queryFn: () => studentHistoryApi.getFeeHistory(studentId),
        enabled: Boolean(studentId),
    });
}
