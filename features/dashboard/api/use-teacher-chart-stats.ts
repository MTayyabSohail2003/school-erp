import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

// ── Types ─────────────────────────────────────────────────────────────────

export type AttendanceBreakdown = { name: string; value: number; color: string };
export type WeeklyAttendancePoint = { day: string; present: number; absent: number; leave: number };
export type ClassSubjectAvg = { subject: string; average: number };

export interface TeacherChartStats {
    todayBreakdown: AttendanceBreakdown[];
    weeklyAttendance: WeeklyAttendancePoint[];
    classSubjectAverages: ClassSubjectAvg[];
    totalStudents: number;
    todayPresent: number;
    todayAbsent: number;
    pendingExams: number;
}

// ── API ────────────────────────────────────────────────────────────────────────

const getTeacherStats = async (): Promise<TeacherChartStats> => {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // Last 7 days
    const last7: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7.push(d.toISOString().split('T')[0]);
    }

    // Total active students
    const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

    // Today's attendance
    const { data: todayAtt } = await supabase
        .from('attendance')
        .select('status')
        .eq('record_date', today);

    const present = (todayAtt ?? []).filter(a => a.status === 'PRESENT').length;
    const absent = (todayAtt ?? []).filter(a => a.status === 'ABSENT').length;
    const leave = (todayAtt ?? []).filter(a => a.status === 'LEAVE').length;

    const todayBreakdown: AttendanceBreakdown[] = [
        { name: 'Present', value: present, color: '#10b981' },
        { name: 'Absent', value: absent, color: '#ef4444' },
        { name: 'Leave', value: leave, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    // Weekly attendance
    const { data: weekAtt } = await supabase
        .from('attendance')
        .select('record_date, status')
        .in('record_date', last7);

    const weekMap = new Map<string, { present: number; absent: number; leave: number }>(
        last7.map(d => [d, { present: 0, absent: 0, leave: 0 }])
    );
    for (const r of weekAtt ?? []) {
        const day = weekMap.get(r.record_date);
        if (!day) continue;
        if (r.status === 'PRESENT') day.present++;
        else if (r.status === 'ABSENT') day.absent++;
        else day.leave++;
    }
    const weeklyAttendance: WeeklyAttendancePoint[] = Array.from(weekMap.entries()).map(([date, counts]) => ({
        day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
        ...counts,
    }));

    // Subject performance per class
    const { data: marksData } = await supabase
        .from('exam_marks')
        .select('marks_obtained, total_marks, subjects(name)');

    const subMap = new Map<string, { total: number; count: number }>();
    for (const m of marksData ?? []) {
        const name = (m as any).subjects?.name;
        if (!name || !m.total_marks) continue;
        const pct = Math.round((m.marks_obtained / m.total_marks) * 100);
        const e = subMap.get(name) ?? { total: 0, count: 0 };
        e.total += pct; e.count++;
        subMap.set(name, e);
    }
    const classSubjectAverages: ClassSubjectAvg[] = Array.from(subMap.entries())
        .map(([subject, d]) => ({ subject, average: Math.round(d.total / d.count) }))
        .sort((a, b) => b.average - a.average).slice(0, 6);

    // Pending exams (no marks entered yet)
    const { count: pendingExams } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true });

    return {
        todayBreakdown,
        weeklyAttendance,
        classSubjectAverages,
        totalStudents: totalStudents ?? 0,
        todayPresent: present,
        todayAbsent: absent,
        pendingExams: pendingExams ?? 0,
    };
};

export function useTeacherChartStats() {
    return useQuery({ queryKey: ['teacher-chart-stats'], queryFn: getTeacherStats, staleTime: 1000 * 60 * 3 });
}
