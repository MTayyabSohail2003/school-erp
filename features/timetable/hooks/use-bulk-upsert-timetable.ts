import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';
import { type TimetableEntry } from '../schemas/timetable.schema';
import { TIMETABLE_CLASS_KEY } from './use-get-class-timetable';

export function useBulkUpsertTimetable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entries: TimetableEntry[]) => timetableApi.bulkUpsertTimetable(entries),
        onSuccess: (_, variables) => {
            if (variables.length > 0) {
                queryClient.invalidateQueries({ queryKey: TIMETABLE_CLASS_KEY(variables[0].class_id) });
            }
        },
    });
}
