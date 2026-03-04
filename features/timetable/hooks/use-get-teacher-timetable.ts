import { useQuery } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';

export function useGetTeacherTimetable(teacherId: string, academicYear: string) {
    return useQuery({
        queryKey: ['timetable', 'teacher', teacherId, academicYear],
        queryFn: () => timetableApi.getTeacherTimetable(teacherId, academicYear),
        enabled: Boolean(teacherId && academicYear),
    });
}
