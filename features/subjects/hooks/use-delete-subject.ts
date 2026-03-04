import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../api/subjects.api';

export function useDeleteSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => subjectsApi.deleteSubject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
}
