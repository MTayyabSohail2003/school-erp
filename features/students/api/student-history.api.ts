import { createClient } from '@/lib/supabase/client';

// Promotion history entry returned from DB
export type PromotionHistoryEntry = {
    id: string;
    student_id: string;
    from_class_id: string;
    to_class_id: string | null;
    from_academic_year: string | null;
    to_academic_year: string | null;
    promoted_by: string | null;
    created_at: string;
    is_graduation: boolean;
    from_class: { name: string; section: string } | null;
    to_class: { name: string; section: string } | null;
};

// Attendance summary grouped by month
export type AttendanceHistoryMonth = {
    month: string; // YYYY-MM
    classId: string;
    className: string;
    classSection: string;
    present: number;
    absent: number;
    leave: number;
    total: number;
    percentage: number;
    records: { date: string; status: 'PRESENT' | 'ABSENT' | 'LEAVE' }[];
};

// Fee challan history entry
export type FeeHistoryEntry = {
    id: string;
    student_id: string;
    month_year: string;
    amount_due: number;
    arrears: number;
    fines: number;
    discount: number;
    paid_amount: number;
    status: string;
    due_date: string;
    paid_date: string | null;
    payment_method: string | null;
    paid_notes: string | null;
    fine_notes: string | null;
    created_at: string;
    fee_structures: {
        classes: { name: string; section: string } | null;
    } | null;
};

export const studentHistoryApi = {
    /**
     * Fetch student enrollment info for timeline baseline
     */
    getStudentEnrollment: async (studentId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                created_at,
                status,
                academic_year,
                classes(name, section)
            `)
            .eq('id', studentId)
            .single();
        if (error) throw new Error(error.message);
        return data as any;
    },

    /**
     * Fetch complete promotion timeline for a student
     */
    getPromotionHistory: async (studentId: string): Promise<PromotionHistoryEntry[]> => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('promotion_history')
            .select(`
                id,
                student_id,
                from_class_id,
                to_class_id,
                from_academic_year,
                to_academic_year,
                promoted_by,
                created_at,
                is_graduation,
                from_class:classes!promotion_history_from_class_id_fkey(name, section),
                to_class:classes!promotion_history_to_class_id_fkey(name, section)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data ?? []) as unknown as PromotionHistoryEntry[];
    },

    /**
     * Fetch ALL attendance records for a student, summarized by month
     */
    getAttendanceHistory: async (studentId: string): Promise<AttendanceHistoryMonth[]> => {
        const supabase = createClient();

        // 1. Fetch attendance records
        const { data, error } = await supabase
            .from('attendance')
            .select('record_date, status, class_id, classes(name, section)')
            .eq('student_id', studentId)
            .order('record_date', { ascending: true });

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) return [];

        // Group by YYYY-MM + class_id (Trusting the database exactly as marked)
        const monthMap = new Map<string, AttendanceHistoryMonth>();

        data.forEach((record: any) => {
            const month = record.record_date.substring(0, 7); // YYYY-MM
            const originalClassData = Array.isArray(record.classes) ? record.classes[0] : record.classes;
            const key = `${month}-${record.class_id}`;

            if (!monthMap.has(key)) {
                monthMap.set(key, {
                    month,
                    classId: record.class_id,
                    className: originalClassData?.name ?? 'Unknown',
                    classSection: originalClassData?.section ?? '',
                    present: 0,
                    absent: 0,
                    leave: 0,
                    total: 0,
                    percentage: 0,
                    records: [],
                });
            }

            const entry = monthMap.get(key)!;
            entry.total++;
            entry.records.push({ date: record.record_date, status: record.status });

            if (record.status === 'PRESENT') entry.present++;
            else if (record.status === 'ABSENT') entry.absent++;
            else if (record.status === 'LEAVE') entry.leave++;
        });

        // Calculate percentages
        monthMap.forEach((entry) => {
            entry.percentage = entry.total > 0
                ? ((entry.present + entry.leave) / entry.total) * 100
                : 0;
        });

        // Return sorted by month descending (newest first)
        return Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));
    },

    /**
     * Fetch ALL fee challans ever generated for a student
     */
    getFeeHistory: async (studentId: string): Promise<FeeHistoryEntry[]> => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('fee_challans')
            .select(`
                id,
                student_id,
                month_year,
                amount_due,
                arrears,
                fines,
                discount,
                paid_amount,
                status,
                due_date,
                paid_date,
                payment_method,
                paid_notes,
                fine_notes,
                created_at,
                fee_structures(
                    classes(name, section)
                )
            `)
            .eq('student_id', studentId)
            .order('month_year', { ascending: false });

        if (error) throw new Error(error.message);

        return (data ?? []).map((c: any) => ({
            ...c,
            amount_due: Number(c.amount_due || 0),
            arrears: Number(c.arrears || 0),
            fines: Number(c.fines || 0),
            discount: Number(c.discount || 0),
            paid_amount: Number(c.paid_amount || 0),
        }));
    },
};
