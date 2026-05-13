import { createClient } from '@/lib/supabase/client';
import { calculateGradeAndPercentage } from '@/features/results/schemas/results.schema';

export const reportCardApi = {
    /**
     * Fetch a student's full result card for a specific exam term.
     * Uses the new `exam_results` + `exam_terms` system.
     */
    getStudentReportCard: async (studentId: string, termId: string) => {
        const supabase = createClient();

        // 1. Student info
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*, classes(name, section)')
            .eq('id', studentId)
            .single();

        if (studentError) throw new Error(studentError.message);

        // 2. Term / exam info (academic_year comes from here)
        const { data: term, error: termError } = await supabase
            .from('exam_terms')
            .select('*')
            .eq('id', termId)
            .single();

        if (termError) throw new Error(termError.message);

        // 3. Results for this student + term
        const { data: results, error: resultsError } = await supabase
            .from('exam_results')
            .select('*, subjects(name, code), classes(name, section)')
            .eq('student_id', studentId)
            .eq('term_id', termId)
            .order('created_at', { ascending: true });

        if (resultsError) throw new Error(resultsError.message);

        // 4. Calculate summary
        const totalMaxMarks = (results ?? []).reduce((sum, r) => sum + r.total_marks, 0);
        const totalObtainedMarks = (results ?? []).reduce((sum, r) => sum + r.obtained_marks, 0);
        const { percentage, grade: finalGrade } = calculateGradeAndPercentage(totalObtainedMarks, totalMaxMarks);

        return {
            student,
            term,
            results: results ?? [],
            summary: {
                totalMaxMarks,
                totalObtainedMarks,
                percentage,
                finalGrade,
                isPassed: percentage >= 40,
            },
        };
    },
};
