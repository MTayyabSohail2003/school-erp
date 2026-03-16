import { useMutation, useQueryClient } from '@tanstack/react-query';
import { periodsApi, type Period } from '../api/periods.api';

export function useCreatePeriod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (period: Omit<Period, 'id'>) => periodsApi.createPeriod(period),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
        },
    });
}
