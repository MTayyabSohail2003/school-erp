import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from './finance.api';
import { type ChallanStatus } from '../schemas/fee-challan.schema';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

const CHALLANS_KEY = ['fee-challans'] as const;

export const useGetChallans = (monthYear?: string, status?: string) => {
    useRealtimeInvalidate({ table: 'fee_challans', queryKey: CHALLANS_KEY });
    return useQuery({
        queryKey: [...CHALLANS_KEY, monthYear, status],
        queryFn: () => financeApi.getChallans(monthYear, status),
    });
};

export const useUpdateChallanStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, paymentMethod }: { id: string; status: ChallanStatus; paymentMethod?: 'CASH' | 'BANK' }) =>
            financeApi.updateChallanStatus(id, status, paymentMethod),
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
