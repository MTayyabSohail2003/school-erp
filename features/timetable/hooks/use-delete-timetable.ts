import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi } from '../api/timetable.api';

export function useDeleteTimetable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string }) => timetableApi.deleteTimetableEntry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timetable'] });
        },
    });
}
