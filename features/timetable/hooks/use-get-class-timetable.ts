import { useQuery } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';

export function useGetClassTimetable(classId: string, academicYear: string) {
    return useQuery({
        queryKey: ['timetable', 'class', classId, academicYear],
        queryFn: () => timetableApi.getClassTimetable(classId, academicYear),
        enabled: Boolean(classId && academicYear),
    });
}
