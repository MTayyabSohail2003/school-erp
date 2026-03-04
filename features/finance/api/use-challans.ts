import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from './finance.api';
import { type ChallanStatus } from '../schemas/fee-challan.schema';

export const useGetChallans = (monthYear?: string, status?: string) =>
    useQuery({
        queryKey: ['fee-challans', monthYear, status],
        queryFn: () => financeApi.getChallans(monthYear, status),
    });

export const useUpdateChallanStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: ChallanStatus }) =>
            financeApi.updateChallanStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee-challans'] });
        },
    });
};

export const useGenerateChallans = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (monthYear: string) => financeApi.generateChallansForMonth(monthYear),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee-challans'] });
        },
    });
};
