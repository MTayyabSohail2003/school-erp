import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from './attendance.api';

export const ATTENDANCE_QUERY_KEY = (classId: string, date: string) =>
    ['attendance', classId, date] as const;

export const useGetAttendance = (classId: string, date: string) =>
    useQuery({
        queryKey: ATTENDANCE_QUERY_KEY(classId, date),
        queryFn: () => attendanceApi.getAttendanceByClassAndDate(classId, date),
        enabled: Boolean(classId && date),
    });
