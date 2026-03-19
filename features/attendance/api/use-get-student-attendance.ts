import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from './attendance.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export function useGetStudentAttendance(studentId?: string) {
    useRealtimeInvalidate({ table: 'attendance', queryKey: ['attendance'] });

    return useQuery({
        queryKey: ['attendance', 'student', studentId],
        queryFn: () => attendanceApi.getAttendanceByStudent(studentId!),
        enabled: Boolean(studentId),
    });
}
