import { createClient } from '@/lib/supabase/client';
import type { payrollApi as PayrollApiType } from './payroll.api';

export type PayrollLedgerEntry = {
    id: string;
    teacher_id: string;
    month_year: string;
    base_salary: number;
    deductions: number;
    net_paid: number;
    status: string;
    paid_at: string;
};

export const payrollLedgerApi = {
    /**
     * Fetch all ledger entries, joined with teacher name and email.
     */
    getLedger: async (): Promise<(PayrollLedgerEntry & { full_name: string; email: string })[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('staff_payroll_ledger')
            .select(`
                id, teacher_id, month_year, base_salary, deductions, net_paid, status, paid_at,
                users!teacher_id ( full_name, email )
            `)
            .order('paid_at', { ascending: false });

        if (error) throw new Error(error.message);

        return (data || []).map((row: any) => ({
            ...row,
            full_name: row.users?.full_name ?? '',
            email: row.users?.email ?? '',
        }));
    },

    /**
     * Record a new monthly payout for a teacher.
     */
    recordPayout: async (params: {
        teacherId: string;
        monthYear: string;
        baseSalary: number;
        deductions: number;
    }): Promise<void> => {
        const supabase = createClient();
        const netPaid = params.baseSalary - params.deductions;

        const { error } = await supabase.from('staff_payroll_ledger').insert({
            teacher_id: params.teacherId,
            month_year: params.monthYear,
            base_salary: params.baseSalary,
            deductions: params.deductions,
            net_paid: netPaid,
            status: 'PAID',
        });

        if (error) throw new Error(error.message);
    },
};
