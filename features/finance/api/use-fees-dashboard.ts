import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesDashboardApi } from './fees-dashboard.api';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export const feesKeys = {
    all: ['fees-dashboard'] as const,
    stats: (month: string, classId?: string) => [...feesKeys.all, 'stats', month, classId || 'all'] as const,
    analytics: (months: string[]) => [...feesKeys.all, 'analytics', ...months] as const,
    students: (month: string, filters?: Record<string, unknown>) => [...feesKeys.all, 'students', month, filters || {}] as const,
};

export function useFeeDashboardStats(monthYear: string, classId?: string) {
    return useQuery({
        queryKey: feesKeys.stats(monthYear, classId),
        queryFn: () => feesDashboardApi.getStats(monthYear, classId),
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
                    id, full_name, roll_number, class_id, monthly_fee, status, photo_url,
                    classes (name, section)
                `)
                .eq('status', 'ACTIVE');

            if (filters?.classId && filters.classId !== 'All') {
                studentQuery = studentQuery.eq('class_id', filters.classId);
            }

            const { data: studentsData, error: studentError } = await studentQuery;
            if (studentError) throw new Error(studentError.message);

            let activeStudents = (studentsData as unknown as {
                id: string;
                full_name: string;
                roll_number: string;
                class_id: string;
                monthly_fee: number;
                status: string;
                photo_url: string | null;
                classes: { name: string; section: string } | null;
            }[] || []);

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

            // 2. Fetch current month challans, past unpaid challans, AND attendance records
            const year = parseInt(monthYear.split('-')[0]);
            const month = parseInt(monthYear.split('-')[1]);
            const startDate = `${monthYear}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${monthYear}-${lastDay}`;

            const [
                { data: currentMonthData, error: currentError },
                { data: pastUnpaidData, error: pastError },
                { data: attendanceData, error: attendanceError }
            ] = await Promise.all([
                supabase.from('fee_challans').select('*').eq('month_year', monthYear),
                supabase.from('fee_challans')
                    .select('*')
                    .lt('month_year', monthYear)
                    .in('student_id', activeStudents.map(s => s.id))
                    .order('month_year', { ascending: true }),
                supabase.from('attendance')
                    .select('student_id, status')
                    .gte('record_date', startDate)
                    .lte('record_date', endDate)
                    .in('student_id', activeStudents.map(s => s.id))
            ]);

            if (currentError) throw new Error(currentError.message);
            if (pastError) throw new Error(pastError.message);
            if (attendanceError) throw new Error(attendanceError.message);

            const challansMap = new Map((currentMonthData || []).map(c => [c.student_id, c]));
            
            // Map to aggregate arrears using cumulative ledger logic
            const arrearsMap = new Map<string, {amount: number, note: string | null}>();
            const studentBalances = new Map<string, {liability: number, paid: number, lastNote: string | null}>();

            (pastUnpaidData || []).forEach(past => {
                const existing = studentBalances.get(past.student_id) || { liability: 0, paid: 0, lastNote: null };
                const currentMonthLiability = (Number(past.amount_due) + Number(past.fines || 0)) - Number(past.discount || 0);
                const currentMonthPaid = Number(past.paid_amount || 0);
                
                // If this specific month had a liability > payment, prioritize its note
                let note = existing.lastNote;
                if (currentMonthLiability > currentMonthPaid && past.paid_notes) {
                    note = past.paid_notes;
                }

                studentBalances.set(past.student_id, {
                    liability: existing.liability + currentMonthLiability,
                    paid: existing.paid + currentMonthPaid,
                    lastNote: note
                });
            });

            studentBalances.forEach((val, studentId) => {
                const calculatedArrears = val.liability - val.paid;
                arrearsMap.set(studentId, {
                    amount: calculatedArrears > 0 ? calculatedArrears : 0,
                    note: calculatedArrears > 0 ? val.lastNote : null // Only show note if debt remains
                });
            });

            // 3. Combine them to create dynamic rows
            let combined = activeStudents.map(student => {
                const challan = challansMap.get(student.id);
                const arrearsInfo = arrearsMap.get(student.id) || { amount: 0, note: null };
                
                // Calculate Attendance stats for this student
                const studentAttendance = (attendanceData || []).filter(a => a.student_id === student.id);
                const totalMarked = studentAttendance.length;
                const presents = studentAttendance.filter(a => a.status === 'PRESENT').length;
                const absents = studentAttendance.filter(a => a.status === 'ABSENT').length;
                const leaves = studentAttendance.filter(a => a.status === 'LEAVE').length;
                
                const attendancePercentage = totalMarked > 0 ? ((presents + leaves) / totalMarked) * 100 : 0;

                return {
                    id: challan ? challan.id : `draft-${student.id}`,
                    student_id: student.id,
                    amount_due: challan ? Number(challan.amount_due) : Number(student.monthly_fee || 0),
                    paid_amount: challan ? Number(challan.paid_amount || 0) : 0,
                    status: challan ? challan.status : 'PENDING',
                    arrears: challan ? Number(challan.arrears || 0) : arrearsInfo.amount,
                    fines: challan ? Number(challan.fines || 0) : 0,
                    discount: challan ? Number(challan.discount || 0) : 0,
                    paid_notes: challan ? challan.paid_notes : null,
                    fine_notes: challan ? challan.fine_notes : null,
                    arrears_note: arrearsInfo.note,
                    payment_method: challan ? challan.payment_method : null,
                    month_year: monthYear,
                    attendance: {
                        percentage: attendancePercentage,
                        stats: {
                            presents,
                            absents,
                            leaves,
                            totalMarked
                        }
                    },
                    students: {
                        full_name: student.full_name,
                        roll_number: student.roll_number,
                        class_id: student.class_id,
                        photo_url: student.photo_url,
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
        mutationFn: ({ id, currentPaid, amount, method, totalDue, studentId, monthYear, extraData }: { 
            id: string, 
            currentPaid: number, 
            amount: number, 
            method: 'CASH'|'BANK'|'ONLINE', 
            totalDue: number, 
            studentId: string, 
            monthYear: string,
            extraData?: {
                fines?: number;
                discount?: number;
                paidNotes?: string;
                fineNotes?: string;
                arrears?: number;
            }
        }) => 
            feesDashboardApi.collectFee(id, currentPaid, amount, method, totalDue, studentId, monthYear, extraData),
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
