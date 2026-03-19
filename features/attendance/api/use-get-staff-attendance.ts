import { useQuery } from '@tanstack/react-query';
import { staffAttendanceApi } from './staff-attendance.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export function useGetStaffAttendance(date: string) {
    useRealtimeInvalidate({ table: 'staff_attendance', queryKey: ['staff-attendance'] });

    return useQuery({
        queryKey: ['staff-attendance', date],
        queryFn: () => staffAttendanceApi.getStaffAttendanceByDate(date),
        enabled: Boolean(date),
    });
}
