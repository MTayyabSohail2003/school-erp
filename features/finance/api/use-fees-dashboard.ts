import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesDashboardApi } from './fees-dashboard.api';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export const feesKeys = {
    all: ['fees-dashboard'] as const,
    stats: (month: string) => [...feesKeys.all, 'stats', month] as const,
    analytics: (months: string[]) => [...feesKeys.all, 'analytics', ...months] as const,
    students: (month: string, filters: any) => [...feesKeys.all, 'students', month, filters] as const,
};

export function useFeeDashboardStats(monthYear: string) {
    return useQuery({
        queryKey: feesKeys.stats(monthYear),
        queryFn: () => feesDashboardApi.getStats(monthYear),
        enabled: !!monthYear,
    });
}

export function useFeeAnalytics(months: string[]) {
    return useQuery({
        queryKey: feesKeys.analytics(months),
        queryFn: () => feesDashboardApi.getAnalytics(months),
        enabled: months.length > 0,
    });
}

export function useFeeStudents(monthYear: string, filters?: { classId?: string, section?: string, status?: string, search?: string }) {
    // We will inline the fetching here since it requires complex filters
    return useQuery({
        queryKey: feesKeys.students(monthYear, filters),
        queryFn: async () => {
            const supabase = createClient();
            
            // 1. Fetch all ACTIVE students directly
            let studentQuery = supabase
                .from('students')
                .select(`
                    id, full_name, roll_number, class_id, monthly_fee, status,
                    classes (name, section)
                `)
                .eq('status', 'ACTIVE');

            if (filters?.classId && filters.classId !== 'All') {
                studentQuery = studentQuery.eq('class_id', filters.classId);
            }

            const { data: studentsData, error: studentError } = await studentQuery;
            if (studentError) throw new Error(studentError.message);

            let activeStudents = studentsData as any[];

            if (filters?.search) {
                const term = filters.search.toLowerCase();
                activeStudents = activeStudents.filter(s => 
                    s.full_name?.toLowerCase().includes(term) ||
                    s.roll_number?.toLowerCase().includes(term)
                );
            }

            if (filters?.section && filters.section !== 'All') {
                activeStudents = activeStudents.filter(s => s.classes?.section === filters.section);
            }

            if (!activeStudents.length) return [];

            // 2. Fetch challans for this month for all context
            // Since it's month-wise, grabbing all for the month is efficient enough
            const { data: challansData, error: challanError } = await supabase
                .from('fee_challans')
                .select('*')
                .eq('month_year', monthYear);

            if (challanError) throw new Error(challanError.message);

            const challansMap = new Map((challansData || []).map(c => [c.student_id, c]));

            // 3. Combine them to create dynamic rows
            let combined = activeStudents.map(student => {
                const challan = challansMap.get(student.id);
                return {
                    id: challan ? challan.id : `draft-${student.id}`,
                    student_id: student.id,
                    amount_due: challan ? Number(challan.amount_due) : Number(student.monthly_fee || 0),
                    paid_amount: challan ? Number(challan.paid_amount || 0) : 0,
                    status: challan ? challan.status : 'PENDING',
                    month_year: monthYear,
                    students: {
                        full_name: student.full_name,
                        roll_number: student.roll_number,
                        class_id: student.class_id,
                        classes: student.classes
                    }
                };
            });

            if (filters?.status && filters.status !== 'All') {
                combined = combined.filter(c => c.status === filters.status);
            }

            return combined;
        },
        enabled: !!monthYear,
    });
}

export function useCollectFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, currentPaid, amount, method, totalDue, studentId, monthYear }: { id: string, currentPaid: number, amount: number, method: 'CASH'|'BANK', totalDue: number, studentId: string, monthYear: string }) => 
            feesDashboardApi.collectFee(id, currentPaid, amount, method, totalDue, studentId, monthYear),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feesKeys.all });
        }
    });
}

// Global realtime hook to invalidate cache
export function useFeesRealtime() {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase.channel('fees-dashboard-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fee_challans' },
                () => {
                    queryClient.invalidateQueries({ queryKey: feesKeys.all });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
}
