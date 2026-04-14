import { createClient } from '@/lib/supabase/client';
import type { payrollApi as PayrollApiType } from './payroll.api';

export type PayrollLedgerEntry = {
    id?: string;
    teacher_id: string;
    month_year: string;
    base_salary: number;
    arrears: number;
    bonus: number;
    fine: number;
    fine_notes?: string;
    paid_notes?: string;
    net_paid: number;
    method: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
    paid_at?: string;
    attendance_percentage?: number;
};

export const payrollLedgerApi = {
    /**
     * Fetch complete payroll dashboard data for a specific month.
     * Calculates arrears, bonuses, and attendance percentage per teacher.
     */
    getPayrollDashboardData: async (monthYear: string): Promise<any[]> => {
        const supabase = createClient();
        
        // 1. Fetch Teachers and Profiles (Using common createClient auth)
        const { data: staffData } = await supabase
            .from('users')
            .select(`
                id, full_name, email, phone_number,
                teacher_profiles(id, qualification, monthly_salary)
            `)
            .eq('role', 'TEACHER');

        if (!staffData) return [];

        const staffIds = staffData.map(s => s.id);

        // 2. Fetch ALL ledger history for these teachers up to target month
        const { data: ledgerHistory } = await supabase
            .from('staff_payroll_ledger')
            .select('*')
            .in('teacher_id', staffIds)
            .lte('month_year', monthYear);

        // 3. Fetch Attendance for the target month accurately
        const year = parseInt(monthYear.split('-')[0]);
        const month = parseInt(monthYear.split('-')[1]);
        const startDate = `${monthYear}-01`;
        const lastDay = new Date(year, month, 0).getDate(); // Get last day of month dynamically
        const endDate = `${monthYear}-${lastDay}`;

        const { data: attendanceData } = await supabase
            .from('staff_attendance')
            .select('user_id, status')
            .gte('record_date', startDate)
            .lte('record_date', endDate);

        // 4. Combine & Calculate
        const dashboardRecords = staffData.map((staff: any) => {
            const profile = Array.isArray(staff.teacher_profiles) ? staff.teacher_profiles[0] : staff.teacher_profiles;
            const staffHistory = ledgerHistory?.filter(l => l.teacher_id === staff.id) || [];
            const targetMonthLedger = staffHistory.find(l => l.month_year === monthYear);

            // Calculate historical arrears (Balance from months before)
            const previousLedgers = staffHistory
                .filter(l => l.month_year < monthYear)
                .sort((a, b) => a.month_year.localeCompare(b.month_year));

            let historicalArrears = 0;
            let lastDebtNote = '';
            previousLedgers.forEach(l => {
                const liability = Number(l.base_salary || 0) + Number(historicalArrears) + Number(l.bonus || 0) - Number(l.fine || 0);
                historicalArrears = liability - Number(l.net_paid || 0);
                if (historicalArrears > 0 && l.paid_notes) {
                    lastDebtNote = l.paid_notes;
                }
            });
            if (historicalArrears < 0) historicalArrears = 0;

            // Calculate Attendance % for this month
            const staffAttendance = attendanceData?.filter(a => a.user_id === staff.id) || [];
            const totalMarked = staffAttendance.length;
            const presentsCount = staffAttendance.filter(a => a.status === 'PRESENT').length;
            const absentsCount = staffAttendance.filter(a => a.status === 'ABSENT').length;
            const leavesCount = staffAttendance.filter(a => a.status === 'LEAVE').length;
            
            // Presents + Leaves count as positive attendance
            const positiveDays = presentsCount + leavesCount;
            const attendancePercentage = totalMarked > 0 ? (positiveDays / totalMarked) * 100 : 0;

            return {
                id: staff.id,
                full_name: staff.full_name,
                email: staff.email,
                phone_number: staff.phone_number,
                profile_id: profile?.id,
                base_salary: profile?.monthly_salary || 0,
                historicalArrears,
                attendancePercentage,
                bonus: targetMonthLedger?.bonus || 0,
                bonus_notes: targetMonthLedger?.bonus_notes || '',
                fine: targetMonthLedger?.fine || 0,
                fine_notes: targetMonthLedger?.fine_notes || '',
                paid_notes: targetMonthLedger?.paid_notes || '',
                net_paid: targetMonthLedger?.net_paid || 0,
                method: targetMonthLedger?.method || 'CASH',
                arrears_note: lastDebtNote, // Carried forward note from previous partial payments
                ledger: targetMonthLedger || null, // Current month's actual payout record
                status: targetMonthLedger?.status || 'PENDING',
                attendanceStats: {
                    presents: presentsCount,
                    absents: absentsCount,
                    leaves: leavesCount,
                    totalMarked
                }
            };
        });

        return dashboardRecords;
    },

    /**
     * Record or update a monthly payout for a teacher.
     */
    recordPayout: async (params: {
        teacher_id: string;
        month_year: string;
        base_salary: number;
        arrears: number;
        bonus: number;
        fine: number;
        fine_notes?: string;
        paid_notes?: string;
        net_paid: number;
        method: string;
        status: string;
    }): Promise<void> => {
        const supabase = createClient();

        const { error } = await supabase.from('staff_payroll_ledger').upsert({
            teacher_id: params.teacher_id,
            month_year: params.month_year,
            base_salary: params.base_salary,
            arrears: params.arrears,
            bonus: params.bonus,
            fine: params.fine,
            fine_notes: params.fine_notes,
            paid_notes: params.paid_notes,
            net_paid: params.net_paid,
            method: params.method,
            status: params.status,
            paid_at: new Date().toISOString(),
        }, { onConflict: 'teacher_id,month_year' });

        if (error) throw new Error(error.message);
    },

    /**
     * Delete an existing ledger payout record.
     */
    deletePayout: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('staff_payroll_ledger').delete().eq('id', id);

        if (error) throw new Error(error.message);
    },

    /**
     * Fetch the complete historical payout ledger.
     */
    getHistoricalLedger: async (): Promise<any[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('staff_payroll_ledger')
            .select(`
                *,
                users!teacher_id(full_name, avatar_url)
            `)
            .order('paid_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data || [];
    },
};
