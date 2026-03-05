import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollLedgerApi } from './payroll-ledger.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

const LEDGER_KEY = ['payroll-ledger'] as const;

export const useGetLedger = () => {
    useRealtimeInvalidate({ table: 'staff_payroll_ledger', queryKey: LEDGER_KEY });
    return useQuery({
        queryKey: LEDGER_KEY,
        queryFn: payrollLedgerApi.getLedger,
    });
};

export const useRecordPayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: payrollLedgerApi.recordPayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-ledger'] });
        },
    });
};
