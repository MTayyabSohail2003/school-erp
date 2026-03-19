import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './dashboard.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

const DASHBOARD_STATS_KEY = ['admin-dashboard-stats'] as const;

export const useAdminDashboardStats = () => {
    // Invalidate dashboard stats on any relevant table change
    useRealtimeInvalidate({ table: 'students', queryKey: DASHBOARD_STATS_KEY });
    useRealtimeInvalidate({ table: 'users', queryKey: DASHBOARD_STATS_KEY });
    useRealtimeInvalidate({ table: 'fee_challans', queryKey: DASHBOARD_STATS_KEY });
    useRealtimeInvalidate({ table: 'attendance', queryKey: DASHBOARD_STATS_KEY });
    useRealtimeInvalidate({ table: 'staff_payroll_ledger', queryKey: DASHBOARD_STATS_KEY });

    const query = useQuery({
        queryKey: DASHBOARD_STATS_KEY,
        queryFn: dashboardApi.getAdminStats,
        // Small staleTime, mostly rely on real-time invalidation
        staleTime: 1000 * 60 * 5,
    });

    return {
        ...query,
        refetchStats: query.refetch,
        isRefetching: query.isRefetching,
    };
};
