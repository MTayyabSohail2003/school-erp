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

    // 1. Monthly Revenue — last 6 months from fee_challans
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const startMonth = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

    const { data: challans } = await supabase
        .from('fee_challans')
        .select('month_year, amount_due, status')
        .gte('month_year', startMonth)
        .order('month_year', { ascending: true });

    // Aggregate by month
    const revenueMap = new Map<string, { collected: number; pending: number }>();
    for (const c of challans ?? []) {
        const existing = revenueMap.get(c.month_year) ?? { collected: 0, pending: 0 };
        if (c.status === 'PAID') existing.collected += c.amount_due ?? 0;
        else existing.pending += c.amount_due ?? 0;
        revenueMap.set(c.month_year, existing);
    }
    const monthlyRevenue: MonthlyRevenuePoint[] = Array.from(revenueMap.entries()).map(([month, vals]) => ({
        month: new Date(`${month}-01`).toLocaleString('default', { month: 'short', year: '2-digit' }),
        collected: Math.round(vals.collected),
        pending: Math.round(vals.pending),
    }));

    // 2. Attendance Trend — last 7 days
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    const { data: attendanceRaw } = await supabase
        .from('attendance')
        .select('record_date, status')
        .in('record_date', last7Days);

    const attendanceMap = new Map<string, { present: number; absent: number; leave: number }>();
    for (const day of last7Days) attendanceMap.set(day, { present: 0, absent: 0, leave: 0 });
    for (const rec of attendanceRaw ?? []) {
        const day = attendanceMap.get(rec.record_date) ?? { present: 0, absent: 0, leave: 0 };
        if (rec.status === 'PRESENT') day.present++;
        else if (rec.status === 'ABSENT') day.absent++;
        else if (rec.status === 'LEAVE') day.leave++;
        attendanceMap.set(rec.record_date, day);
    }
    const attendanceTrend: AttendanceTrendPoint[] = Array.from(attendanceMap.entries()).map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString('default', { weekday: 'short', day: 'numeric', month: 'short' }),
        ...counts,
    }));

    // 3. Students per Class
    const { data: classData } = await supabase
        .from('students')
        .select('class_id, classes(name, section)')
        .eq('status', 'ACTIVE');

    const classMap = new Map<string, number>();
    for (const s of classData ?? []) {
        const cls = (s as any).classes;
        if (cls) {
            const key = `${cls.name} ${cls.section}`;
            classMap.set(key, (classMap.get(key) ?? 0) + 1);
        }
    }
    const classStrength: ClassStrengthPoint[] = Array.from(classMap.entries())
        .map(([cls, students]) => ({ class: cls, students }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 10);

    // 4. Fee Status Breakdown for current month
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const { data: currentChallans } = await supabase
        .from('fee_challans')
        .select('status')
        .eq('month_year', currentMonth);

    const statusCount = { PAID: 0, PENDING: 0, OVERDUE: 0 };
    for (const c of currentChallans ?? []) {
        if (c.status in statusCount) statusCount[c.status as keyof typeof statusCount]++;
    }
    const feeStatusBreakdown: FeeStatusBreakdown[] = [
        { name: 'Paid', value: statusCount.PAID, color: '#10b981' },
        { name: 'Pending', value: statusCount.PENDING, color: '#f59e0b' },
        { name: 'Overdue', value: statusCount.OVERDUE, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // 5. Subject Performance from exam_marks (latest data)
    const { data: marksData } = await supabase
        .from('exam_marks')
        .select('marks_obtained, total_marks, subjects(name)')
        .not('marks_obtained', 'is', null);

    const subjectMap = new Map<string, { total: number; count: number; highest: number }>();
    for (const m of marksData ?? []) {
        const subjectName = (m as any).subjects?.name;
        if (!subjectName || !m.total_marks) continue;
        const pct = Math.round((m.marks_obtained / m.total_marks) * 100);
        const existing = subjectMap.get(subjectName) ?? { total: 0, count: 0, highest: 0 };
        existing.total += pct;
        existing.count++;
        existing.highest = Math.max(existing.highest, pct);
        subjectMap.set(subjectName, existing);
    }
    const subjectPerformance: SubjectPerformancePoint[] = Array.from(subjectMap.entries())
        .map(([subject, data]) => ({
            subject,
            average: Math.round(data.total / data.count),
            highest: data.highest,
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 8);

    return { monthlyRevenue, attendanceTrend, classStrength, feeStatusBreakdown, subjectPerformance };
};

// ── Hook ──────────────────────────────────────────────────────────────────

export function useChartStats() {
    return useQuery({
        queryKey: ['chart-stats'],
        queryFn: getChartStats,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });
}
