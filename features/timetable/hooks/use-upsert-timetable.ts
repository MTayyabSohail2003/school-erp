import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';
import { type TimetableEntry } from '../schemas/timetable.schema';

export function useUpsertTimetable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entry: TimetableEntry) => timetableApi.upsertTimetableEntry(entry),
        onSuccess: (_, variables) => {
            // Invalidate relevant queries to trigger UI refetch instantly
            queryClient.invalidateQueries({ queryKey: ['timetable', 'class', variables.class_id, variables.academic_year] });
            queryClient.invalidateQueries({ queryKey: ['timetable', 'teacher', variables.teacher_id, variables.academic_year] });
        },
    });
}
