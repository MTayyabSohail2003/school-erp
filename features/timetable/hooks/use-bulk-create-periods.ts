import { useMutation, useQueryClient } from '@tanstack/react-query';
import { periodsApi, type Period } from '../api/periods.api';

export function useBulkCreatePeriods() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (periods: Omit<Period, 'id'>[]) => periodsApi.bulkCreatePeriods(periods),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
        },
    });
}
