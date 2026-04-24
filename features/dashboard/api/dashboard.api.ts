import { createClient } from '@/lib/supabase/client';

export const dashboardApi = {
    getAdminStats: async () => {
        const supabase = createClient();

        const { data, error } = await supabase.rpc('get_admin_dashboard_stats_v1');

        if (error) throw error;
        
        return data as {
            studentCount: number;
            teacherCount: number;
            financials: {
                currentMonthCollected: number;
                currentMonthPending: number;
                currentMonthPaidCount: number;
                currentMonthPendingCount: number;
                currentMonthStaffPayroll: number;
                currentMonthProfit: number;
                totalArrears: number;
                totalDefaultersCount: number;
            };
            attendance: {
                date: string;
                rate: number;
                present: number;
                absent: number;
                onLeave: number;
                totalMarked: number;
            };
        };
    }

};
