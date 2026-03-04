import { createClient } from '@/lib/supabase/client';
import { type MarkWithDetails } from '@/features/marks/schemas/mark.schema';

export const reportCardApi = {
    getStudentReportCard: async (studentId: string, examId: string) => {
        const supabase = createClient();

        // 1. Get student info & class
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*, classes(name, section)')
            .eq('id', studentId)
            .single();

        if (studentError) throw new Error(studentError.message);

        // 2. Get exam info
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();

        if (examError) throw new Error(examError.message);

        // 3. Get all marks for this student + exam
        const { data: marks, error: marksError } = await supabase
            .from('exam_marks')
            .select('*, subjects(name)')
            .eq('student_id', studentId)
            .eq('exam_id', examId);

        if (marksError) throw new Error(marksError.message);

        // 4. Calculate totals
        const totalMaxMarks = marks.reduce((sum, m) => sum + m.total_marks, 0);
        const totalObtainedMarks = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
        const percentage = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;

        return {
            student,
            exam,
            marks: marks as (MarkWithDetails & { subjects: { name: string } })[],
            summary: {
                totalMaxMarks,
                totalObtainedMarks,
                percentage: percentage.toFixed(1),
            },
        };
    },
};
