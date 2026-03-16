import { useMutation, useQueryClient } from '@tanstack/react-query';
import { periodsApi } from '../api/periods.api';

export function useDeletePeriod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => periodsApi.deletePeriod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
        },
    });
}
