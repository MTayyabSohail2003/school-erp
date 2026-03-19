import { useQuery } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export function useGetAllTimetable(academicYear: string) {
    useRealtimeInvalidate({ table: 'timetable', queryKey: ['timetable', 'all', academicYear] });

    return useQuery({
        queryKey: ['timetable', 'all', academicYear],
        queryFn: () => timetableApi.getAllTimetable(academicYear),
        enabled: Boolean(academicYear),
    });
}
