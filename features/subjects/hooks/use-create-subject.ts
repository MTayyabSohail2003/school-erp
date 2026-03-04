import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../api/subjects.api';

export function useCreateSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, code }: { name: string; code: string | null }) => subjectsApi.createSubject(name, code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
}
