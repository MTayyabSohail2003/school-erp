import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollLedgerApi } from './payroll-ledger.api';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export const payrollKeys = {
    all: ['payroll-ledger'] as const,
    dashboard: (month: string) => [...payrollKeys.all, 'dashboard', month] as const,
    historical: () => [...payrollKeys.all, 'historical'] as const,
};

export const useGetPayrollDashboard = (monthYear: string) => {
    return useQuery({
        queryKey: payrollKeys.dashboard(monthYear),
        queryFn: () => payrollLedgerApi.getPayrollDashboardData(monthYear),
        enabled: !!monthYear,
    });
};

export const useGetHistoricalLedger = () => {
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

// Global realtime hook to invalidate cache for multiple sources
export function usePayrollRealtime() {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        const supabase = createClient();
        
        // Listen to ledger changes (payouts)
        const ledgerChannel = supabase.channel('payroll-ledger-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'staff_payroll_ledger' },
                () => queryClient.invalidateQueries({ queryKey: payrollKeys.all })
            )
            .subscribe();

        // Listen to salary changes (profiles)
        const profileChannel = supabase.channel('salary-profiles-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'teacher_profiles' },
                () => queryClient.invalidateQueries({ queryKey: payrollKeys.all })
            )
            .subscribe();

        // Listen to attendance changes
        const attendanceChannel = supabase.channel('payroll-attendance-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'staff_attendance' },
                () => queryClient.invalidateQueries({ queryKey: payrollKeys.all })
            )
            .subscribe();

        return () => {
            supabase.removeChannel(ledgerChannel);
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(attendanceChannel);
        };
    }, [queryClient]);
}
