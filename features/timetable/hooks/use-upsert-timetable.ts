import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';
import { type TimetableEntry, type TimetableWithDetails } from '../schemas/timetable.schema';

export function useUpsertTimetable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entry: TimetableEntry) => timetableApi.upsertTimetableEntry(entry),
        onMutate: async (newEntry) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['timetable'] });

            // Snapshot the previous value
            const previousAllTimetable = queryClient.getQueryData(['timetable', 'all', newEntry.academic_year]);
            const previousClassTimetable = queryClient.getQueryData(['timetable', 'class', newEntry.class_id, newEntry.academic_year]);

            // Optimistically update to the new value
            // We create a "fake" TimetableWithDetails object to render instantly
            const optimisticEntry = {
                ...newEntry,
                id: `temp-${Date.now()}`,
                // We'll just leave these relational fields partial/empty, the UI will fall back gracefully,
                // or we could guess them from the environment, but usually just having the ID is enough 
                // for the grid to know "a slot exists here".
                subjects: { name: 'Saving...', code: '' },
                users: { full_name: 'Updating' },
            };

            const updateCache = (old: TimetableWithDetails[] | undefined) => {
                if (!old) return [optimisticEntry as TimetableWithDetails];
                // Remove existing entry for the same slot if any
                const filtered = old.filter((e: TimetableWithDetails) => !(e.period_id === newEntry.period_id && e.day_of_week === newEntry.day_of_week));
                return [...filtered, optimisticEntry as TimetableWithDetails];
            };

            queryClient.setQueryData(['timetable', 'all', newEntry.academic_year], updateCache);
            queryClient.setQueryData(['timetable', 'class', newEntry.class_id, newEntry.academic_year], updateCache);
            queryClient.setQueryData(['timetable', 'teacher', newEntry.teacher_id, newEntry.academic_year], updateCache);

            // Return a context object with the snapshotted value
            return { previousAllTimetable, previousClassTimetable };
        },
        onError: (err, newEntry, context) => {
            // Roll back to the previous states if mutation fails
            if (context?.previousAllTimetable) {
                queryClient.setQueryData(['timetable', 'all', newEntry.academic_year], context.previousAllTimetable);
            }
            if (context?.previousClassTimetable) {
                queryClient.setQueryData(['timetable', 'class', newEntry.class_id, newEntry.academic_year], context.previousClassTimetable);
            }
        },
        onSettled: (_, error, variables) => {
            // Always refetch after error or success to ensure true state
            queryClient.invalidateQueries({ queryKey: ['timetable', 'all', variables.academic_year] });
            queryClient.invalidateQueries({ queryKey: ['timetable', 'class', variables.class_id, variables.academic_year] });
            queryClient.invalidateQueries({ queryKey: ['timetable', 'teacher', variables.teacher_id, variables.academic_year] });
        },
    });
}
