import { useQuery } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';

export const TIMETABLE_CLASS_KEY = (classId: string) => ['timetable', 'class', classId] as const;

export function useGetClassTimetable(classId: string, academicYear: string) {
    return useQuery({
        queryKey: [...TIMETABLE_CLASS_KEY(classId), academicYear],
        queryFn: () => timetableApi.getClassTimetable(classId, academicYear),
        enabled: Boolean(classId && academicYear),
    });
}
