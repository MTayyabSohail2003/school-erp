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
    managingClasses: { id: string; name: string; section: string | null }[];
}

// ── API ────────────────────────────────────────────────────────────────────────

const getTeacherStats = async (teacherId: string): Promise<TeacherChartStats> => {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // 0. Find managing classes (Class Teacher + Period Assignments)
    const { data: classTeacherData } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('class_teacher_id', teacherId);

    const { data: periodData } = await supabase
        .from('timetable')
        .select('class_id, classes(id, name, section)')
        .eq('teacher_id', teacherId);

    const classMap = new Map<string, { id: string; name: string; section: string | null }>();
    (classTeacherData ?? []).forEach(c => classMap.set(c.id, c));
    (periodData ?? []).forEach(p => {
        const classes = p.classes as unknown as { id: string; name: string; section: string | null }[];
        const c = classes?.[0];
        if (c) classMap.set(c.id, c);
    });

    const managingClasses = Array.from(classMap.values());
    const classIds = managingClasses.map(c => c.id);

    if (classIds.length === 0) {
        return {
            todayBreakdown: [],
            weeklyAttendance: [],
            classSubjectAverages: [],
            totalStudents: 0,
            todayPresent: 0,
            todayAbsent: 0,
            pendingExams: 0,
            managingClasses: [],
        };
    }

    // Last 7 days
    const last7: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7.push(d.toISOString().split('T')[0]);
    }

    // Total active students in ALL managing classes
    const { data: classStudents, count: totalStudents } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .in('class_id', classIds)
        .eq('status', 'ACTIVE');

    const studentIds = classStudents?.map(s => s.id) || [];

    if (studentIds.length === 0) {
        return {
            todayBreakdown: [],
            weeklyAttendance: [],
            classSubjectAverages: [],
            totalStudents: 0,
            todayPresent: 0,
            todayAbsent: 0,
            pendingExams: 0,
            managingClasses,
        };
    }

    // Today's attendance for these students
    const { data: todayAtt } = await supabase
        .from('attendance')
        .select('status')
        .eq('record_date', today)
        .in('student_id', studentIds);

    const present = (todayAtt ?? []).filter(a => a.status === 'PRESENT').length;
    const absent = (todayAtt ?? []).filter(a => a.status === 'ABSENT').length;
    const leave = (todayAtt ?? []).filter(a => a.status === 'LEAVE').length;

    const todayBreakdown: AttendanceBreakdown[] = [
        { name: 'Present', value: present, color: '#10b981' },
        { name: 'Absent', value: absent, color: '#ef4444' },
        { name: 'Leave', value: leave, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    // Weekly attendance for these students
    const { data: weekAtt } = await supabase
        .from('attendance')
        .select('record_date, status')
        .in('record_date', last7)
        .in('student_id', studentIds);

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

    // Subject performance for these students
    const { data: marksData } = await supabase
        .from('exam_marks')
        .select('marks_obtained, total_marks, subjects(name)')
        .in('student_id', studentIds);

    const subMap = new Map<string, { total: number; count: number }>();
    for (const m of marksData ?? []) {
        const subjects = m.subjects as unknown as { name: string }[];
        const name = subjects?.[0]?.name;
        if (!name || !m.total_marks) continue;
        const pct = Math.round((m.marks_obtained / m.total_marks) * 100);
        const e = subMap.get(name) ?? { total: 0, count: 0 };
        e.total += pct; e.count++;
        subMap.set(name, e);
    }
    const classSubjectAverages: ClassSubjectAvg[] = Array.from(subMap.entries())
        .map(([subject, d]) => ({ subject, average: Math.round(d.total / d.count) }))
        .sort((a, b) => b.average - a.average).slice(0, 6);

    // Exams (could filter by subjects taught by teacher, but usually they want to see class exam status)
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
        managingClasses,
    };
};

export function useTeacherChartStats(teacherId: string) {
    return useQuery({ 
        queryKey: ['teacher-chart-stats', teacherId], 
        queryFn: () => getTeacherStats(teacherId), 
        staleTime: 1000 * 60 * 3,
        enabled: Boolean(teacherId)
    });
}
