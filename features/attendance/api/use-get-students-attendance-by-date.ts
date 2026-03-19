import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from './attendance.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export function useGetStudentsAttendanceByDate(studentIds: string[], date: string) {
    useRealtimeInvalidate({ table: 'attendance', queryKey: ['attendance'] });

    return useQuery({
        queryKey: ['attendance', 'students', studentIds, date],
        queryFn: () => attendanceApi.getAttendanceByStudentsAndDate(studentIds, date),
        enabled: studentIds.length > 0 && !!date,
    });
}
