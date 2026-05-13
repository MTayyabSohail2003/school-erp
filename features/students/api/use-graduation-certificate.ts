import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const graduationCertificateKeys = {
    all: ['graduation-certificate'] as const,
    student: (studentId: string) =>
        [...graduationCertificateKeys.all, studentId] as const,
};

export function useGraduationCertificate(studentId: string) {
    return useQuery({
        queryKey: graduationCertificateKeys.student(studentId),
        queryFn: async () => {
            const supabase = createClient();

            // 1. Fetch full student info
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select(`
                    *,
                    classes(name, section),
                    users!students_parent_id_fkey(full_name, phone_number)
                `)
                .eq('id', studentId)
                .single();

            if (studentError) throw new Error(studentError.message);

            // 2. Fetch promotion history to get graduation record
            const { data: history } = await supabase
                .from('promotion_history')
                .select('*')
                .eq('student_id', studentId)
                .eq('action', 'GRADUATION')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // 3. Fetch all results for the final term summary
            const { data: results } = await supabase
                .from('exam_results')
                .select(`
                    obtained_marks, total_marks, grade, percentage,
                    subjects(name),
                    exam_terms!inner(name, academic_year)
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            // Compute final academic summary
            const totalObtained = (results ?? []).reduce((s, r) => s + r.obtained_marks, 0);
            const totalMax = (results ?? []).reduce((s, r) => s + r.total_marks, 0);
            const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

            return {
                student,
                history,
                results: results ?? [],
                summary: {
                    totalObtained,
                    totalMax,
                    overallPercentage: overallPercentage.toFixed(1),
                },
            };
        },
        enabled: !!studentId,
    });
}
