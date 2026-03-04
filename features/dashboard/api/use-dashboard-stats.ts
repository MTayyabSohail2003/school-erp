import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './dashboard.api';

export const useAdminDashboardStats = () => {
    return useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: dashboardApi.getAdminStats,
        // Data doesn't change every second, poll every 5 mins or rely on invalidation
        staleTime: 1000 * 60 * 5,
    });
};
