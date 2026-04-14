import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from './finance.api';
import { updateChallanStatusAction } from '../actions/challan-actions';
import { type ChallanStatus } from '../schemas/fee-challan.schema';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { broadcastNotification } from '@/features/notifications/actions/notification-actions';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';

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
        mutationFn: async ({ id, ...data }: { 
            id: string; 
            status: ChallanStatus; 
            paymentMethod?: 'CASH' | 'BANK' | 'ONLINE';
            paidAmount?: number;
            fines?: number;
            discount?: number;
            paidNotes?: string;
        }) => {
            const result = await updateChallanStatusAction(id, data);
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee-challans'] });
        },
    });
};

export const useGenerateChallans = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (monthYear: string) => financeApi.generateChallansForMonth(monthYear),
        onSuccess: async (data, monthYear) => {
            queryClient.invalidateQueries({ queryKey: ['fee-challans'] });
            
            // Broadcast notification to all parents
            if (data.count > 0) {
                await broadcastNotification(['PARENT'], NotificationTemplates.FEE_CHALLAN_GENERATED(monthYear));
            }
        },
    });
};
