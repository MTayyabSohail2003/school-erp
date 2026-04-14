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
    getStats: async (monthYear: string, classId?: string): Promise<DashboardStats> => {
        const supabase = createClient();
        
        // 1. Fetch Students in scope
        let studentQuery = supabase.from('students').select('id, monthly_fee, created_at').eq('status', 'ACTIVE');
        if (classId) studentQuery = studentQuery.eq('class_id', classId);
        
        const { data: students } = await studentQuery;
        if (!students) return { totalStudents: 0, totalFee: 0, totalCollected: 0, totalPending: 0, newStudentsThisMonth: 0 };

        const studentIds = students.map(s => s.id);

        // 2. Fetch ALL challans for these students up to target month
        const { data: allChallans } = await supabase
            .from('fee_challans')
            .select('student_id, month_year, amount_due, arrears, fines, discount, paid_amount')
            .in('student_id', studentIds)
            .lte('month_year', monthYear);

        // 3. Aggregate
        let totalFee = 0;
        let totalCollected = 0;
        let totalPending = 0;
        let newStudents = 0;

        // Group challans by student to calculate arrears per student
        const challansByStudent = new Map<string, any[]>();
        allChallans?.forEach(c => {
            if (!challansByStudent.has(c.student_id)) challansByStudent.set(c.student_id, []);
            challansByStudent.get(c.student_id)?.push(c);
        });

        students.forEach(student => {
            const sChallans = challansByStudent.get(student.id) || [];
            const targetMonthChallan = sChallans.find(c => c.month_year === monthYear);
            
            // Calculate Historical Arrears (up to month before target)
            let historicalArrears = 0;
            sChallans.filter(c => c.month_year < monthYear).forEach(c => {
                const due = Number(c.amount_due || 0) + Number(c.fines || 0) - Number(c.discount || 0);
                historicalArrears += (due - Number(c.paid_amount || 0));
            });
            if (historicalArrears < 0) historicalArrears = 0;

            // Current Month Liability
            const baseFee = targetMonthChallan ? Number(targetMonthChallan.amount_due) : Number(student.monthly_fee || 0);
            const currentFines = targetMonthChallan ? Number(targetMonthChallan.fines || 0) : 0;
            const currentDiscount = targetMonthChallan ? Number(targetMonthChallan.discount || 0) : 0;
            
            const totalMonthlyLiability = baseFee + historicalArrears + currentFines - currentDiscount;
            
            totalFee += totalMonthlyLiability;
            totalCollected += targetMonthChallan ? Number(targetMonthChallan.paid_amount || 0) : 0;

            // New students check
            if (student.created_at.startsWith(monthYear)) {
                newStudents++;
            }
        });

        return {
            totalStudents: students.length,
            totalFee,
            totalCollected,
            totalPending: totalFee - totalCollected,
            newStudentsThisMonth: newStudents,
        };
    },

    // 2. Collect Fee
    collectFee: async (
        id: string, 
        currentPaidAmount: number, 
        paymentAmount: number, 
        method: 'CASH'|'BANK'|'ONLINE', 
        totalDue: number, 
        studentId: string, 
        monthYear: string,
        extraData?: {
            fines?: number;
            discount?: number;
            paidNotes?: string;
            fineNotes?: string;
        }
    ) => {
        const supabase = createClient();
        
        // Final values
        const finalFines = extraData?.fines || 0;
        const finalDiscount = extraData?.discount || 0;
        const totalWithExtras = totalDue + finalFines - finalDiscount;
        
        // Status logic
        let status: ChallanStatus = 'PENDING';
        if (paymentAmount >= totalWithExtras) {
            status = 'PAID';
        } else if (paymentAmount > 0) {
            status = 'PARTIAL';
        }

        const payload: Partial<FeeChallan> = {
            paid_amount: paymentAmount,
            status,
            fines: finalFines,
            discount: finalDiscount,
            paid_notes: extraData?.paidNotes || null,
            fine_notes: extraData?.fineNotes || null,
        };

        if (status === 'PAID' || status === 'PARTIAL') {
            payload.paid_date = new Date().toISOString().split('T')[0];
            payload.payment_method = method;
        }

        if (id.startsWith('draft-')) {
            const insertPayload: Partial<FeeChallan> = {
                ...payload,
                student_id: studentId,
                month_year: monthYear,
                amount_due: totalDue, // Base due
                arrears: extraData?.arrears || 0, // Persist calculated arrears
                due_date: `${monthYear}-10`,
            };
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
