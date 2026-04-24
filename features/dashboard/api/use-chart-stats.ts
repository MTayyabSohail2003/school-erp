import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────────────────────────────

export type MonthlyRevenuePoint = { month: string; collected: number; pending: number };
export type AttendanceTrendPoint = { date: string; present: number; absent: number; leave: number };
export type ClassStrengthPoint = { class: string; students: number };
export type FeeStatusBreakdown = { name: string; value: number; color: string };
export type SubjectPerformancePoint = { subject: string; average: number; highest: number };

export interface ChartStats {
    monthlyRevenue: MonthlyRevenuePoint[];
    attendanceTrend: AttendanceTrendPoint[];
    classStrength: ClassStrengthPoint[];
    feeStatusBreakdown: FeeStatusBreakdown[];
    subjectPerformance: SubjectPerformancePoint[];
}

// ── API ──────────────────────────────────────────────────────────────────

const getChartStats = async (): Promise<ChartStats> => {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_admin_chart_stats_v1');

    if (error) throw error;
    
    return data as ChartStats;
};


// ── Hook ──────────────────────────────────────────────────────────────────

export function useChartStats() {
    return useQuery({
        queryKey: ['chart-stats'],
        queryFn: getChartStats,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });
}
