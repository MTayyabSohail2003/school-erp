import { useQuery } from '@tanstack/react-query';
import { staffAttendanceApi } from './staff-attendance.api';

export function useGetStaffAttendance(date: string) {
    return useQuery({
        queryKey: ['staff-attendance', date],
        queryFn: () => staffAttendanceApi.getStaffAttendanceByDate(date),
        enabled: Boolean(date),
    });
}
