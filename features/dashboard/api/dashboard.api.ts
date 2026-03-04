import { createClient } from '@/lib/supabase/client';

export const dashboardApi = {
    getAdminStats: async () => {
        const supabase = createClient();

        // 1. Total Students & Teachers
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: teacherCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'TEACHER');

        // 2. Financials (Current Month)
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const { data: challans } = await supabase.from('fee_challans').select('amount_due, status').eq('month_year', currentMonth);

        let totalCollected = 0;
        let totalPending = 0;

        challans?.forEach(c => {
            if (c.status === 'PAID') totalCollected += Number(c.amount_due);
            else totalPending += Number(c.amount_due);
        });

        // 3. Overall Defaulters (All Time)
        // Defaulters = PENDING and past due, or OVERDUE
        const { data: allChallans } = await supabase.from('fee_challans').select('amount_due, status, due_date, student_id');
        let totalArrears = 0;
        const defaultersSet = new Set<string>();

        const todayIso = today.toISOString().split('T')[0];

        allChallans?.forEach(c => {
            if (c.status === 'OVERDUE' || (c.status === 'PENDING' && c.due_date < todayIso)) {
                totalArrears += Number(c.amount_due);
                defaultersSet.add(c.student_id);
            }
        });

        // 4. Today's Attendance
        const { data: attendance } = await supabase.from('attendance').select('status').eq('record_date', todayIso);

        let presentCount = 0;
        let absentCount = 0;
        let onLeaveCount = 0;

        attendance?.forEach(a => {
            if (a.status === 'PRESENT') presentCount++;
            if (a.status === 'ABSENT') absentCount++;
            if (a.status === 'LEAVE') onLeaveCount++;
        });

        const totalMarked = presentCount + absentCount + onLeaveCount;
        const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

        return {
            studentCount: studentCount ?? 0,
            teacherCount: teacherCount ?? 0,
            financials: {
                currentMonthCollected: totalCollected,
                currentMonthPending: totalPending,
                totalArrears: totalArrears,
                totalDefaultersCount: defaultersSet.size,
            },
            attendance: {
                date: todayIso,
                rate: attendanceRate,
                present: presentCount,
                absent: absentCount,
                onLeave: onLeaveCount,
                totalMarked: totalMarked
            }
        };
    }
};
