import { createClient } from '@/lib/supabase/client';
import { type FeeChallan, type ChallanStatus } from '../schemas/fee-challan.schema';

export type DashboardStats = {
    totalStudents: number;
    totalFee: number;
    totalCollected: number;
    totalPending: number;
    newStudentsThisMonth: number;
};

export type MonthlyAnalytics = {
    month: string;
    collected: number;
    students: number;
};

export const feesDashboardApi = {
    // 1. Get stats
    getStats: async (monthYear: string): Promise<DashboardStats> => {
        const supabase = createClient();
        
        // Parallel fetching
        const [
            { count: totalStudents },
            { data: activeStudents },
            { data: challans },
            { count: newStudents }
        ] = await Promise.all([
            // total students
            supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
            // all active students to sum expected fees
            supabase.from('students').select('id, monthly_fee').eq('status', 'ACTIVE'),
            // challans for the month
            supabase.from('fee_challans').select('student_id, amount_due, paid_amount, status').eq('month_year', monthYear),
            // new students this month based on created_at
            supabase.from('students')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', `${monthYear}-01T00:00:00Z`)
                .lt('created_at', monthYear === new Date().toISOString().substring(0, 7) 
                    ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString() 
                    : `${monthYear}-31T23:59:59Z`) // Simplified date bound for SQL
        ]);

        let totalFee = 0;
        let totalCollected = 0;
        let totalPending = 0;

        const processedStudents = new Set<string>();

        challans?.forEach(c => {
            totalFee += Number(c.amount_due || 0);
            totalCollected += Number(c.paid_amount || 0);
            totalPending += (Number(c.amount_due || 0) - Number(c.paid_amount || 0));
            if (c.student_id) processedStudents.add(c.student_id);
        });

        activeStudents?.forEach(s => {
            if (!processedStudents.has(s.id)) {
                totalFee += Number(s.monthly_fee || 0);
                totalPending += Number(s.monthly_fee || 0);
            }
        });

        return {
            totalStudents: totalStudents || 0,
            totalFee,
            totalCollected,
            totalPending,
            newStudentsThisMonth: newStudents || 0,
        };
    },

    // 2. Collect Fee
    collectFee: async (id: string, currentPaidAmount: number, paymentAmount: number, method: 'CASH'|'BANK', totalDue: number, studentId: string, monthYear: string) => {
        const supabase = createClient();
        const newPaidAmount = currentPaidAmount + paymentAmount;
        
        let status: ChallanStatus = 'PENDING';
        if (newPaidAmount >= totalDue) {
            status = 'PAID';
        }

        const payload: Partial<FeeChallan> = {
            paid_amount: newPaidAmount,
            status,
        };

        if (status === 'PAID' || paymentAmount > 0) {
            // we register payment date and method even if partial
            payload.paid_date = new Date().toISOString().split('T')[0];
            payload.payment_method = method;
        }

        if (id.startsWith('draft-')) {
            const insertPayload = {
                ...payload,
                student_id: studentId,
                month_year: monthYear,
                amount_due: totalDue,
                due_date: `${monthYear}-10`,
            } as any;
            const { error } = await supabase.from('fee_challans').insert(insertPayload);
            if (error) throw new Error(error.message);
        } else {
            const { error } = await supabase
                .from('fee_challans')
                .update(payload)
                .eq('id', id);

            if (error) throw new Error(error.message);
        }
    },

    // 3. Get Monthly Analytics (last 6 months e.g.)
    getAnalytics: async (months: string[]): Promise<MonthlyAnalytics[]> => {
        const supabase = createClient();
        const { data: challans, error } = await supabase
            .from('fee_challans')
            .select('month_year, paid_amount')
            .in('month_year', months);

        if (error) throw new Error(error.message);

        const analyticsMap = new Map<string, MonthlyAnalytics>();
        months.forEach(m => analyticsMap.set(m, { month: m, collected: 0, students: 0 }));

        challans?.forEach(c => {
            const entry = analyticsMap.get(c.month_year);
            if (entry) {
                entry.collected += Number(c.paid_amount || 0);
            }
        });

        const { data: students, error: stdError } = await supabase
            .from('students')
            .select('created_at');

        if (stdError) throw new Error(stdError.message);

        students?.forEach(s => {
            const monthStr = s.created_at.substring(0, 7);
            const entry = analyticsMap.get(monthStr);
            if (entry) {
                entry.students += 1;
            }
        });

        return Array.from(analyticsMap.values()).sort((a,b) => a.month.localeCompare(b.month));
    }
}
