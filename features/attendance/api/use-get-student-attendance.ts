import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from './attendance.api';

export function useGetStudentAttendance(studentId?: string) {
    return useQuery({
        queryKey: ['attendance', 'student', studentId],
        queryFn: () => attendanceApi.getAttendanceByStudent(studentId!),
        enabled: Boolean(studentId),
    });
}
