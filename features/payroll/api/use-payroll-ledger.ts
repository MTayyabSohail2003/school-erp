import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollLedgerApi } from './payroll-ledger.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export const payrollKeys = {
    all: ['payroll-ledger'] as const,
    dashboard: (month: string) => [...payrollKeys.all, 'dashboard', month] as const,
    historical: () => [...payrollKeys.all, 'historical'] as const,
};

export const useGetPayrollDashboard = (monthYear: string) => {
    useRealtimeInvalidate({ table: 'staff_payroll_ledger', queryKey: payrollKeys.dashboard(monthYear) });
    return useQuery({
        queryKey: payrollKeys.dashboard(monthYear),
        queryFn: () => payrollLedgerApi.getPayrollDashboardData(monthYear),
        enabled: !!monthYear,
    });
};

export const useGetHistoricalLedger = () => {
    useRealtimeInvalidate({ table: 'staff_payroll_ledger', queryKey: payrollKeys.historical() });
    return useQuery({
        queryKey: payrollKeys.historical(),
        queryFn: () => payrollLedgerApi.getHistoricalLedger(),
    });
};

export const useRecordPayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: payrollLedgerApi.recordPayout,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.dashboard(variables.month_year) });
        },
    });
};

export const useDeletePayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: payrollLedgerApi.deletePayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.all });
        },
    });
};
