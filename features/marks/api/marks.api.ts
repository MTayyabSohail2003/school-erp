import { createClient } from '@/lib/supabase/client';
import { type MarkEntry, type MarkWithDetails } from '../schemas/mark.schema';

export const marksApi = {
    getMarksByExamAndClass: async (examId: string, classId: string): Promise<MarkWithDetails[]> => {
        const supabase = createClient();

        // First, get all student IDs in the given class
        const { data: classStudents, error: studentsError } = await supabase
            .from('students')
            .select('id')
            .eq('class_id', classId)
            .eq('status', 'ACTIVE');

        if (studentsError) throw new Error(studentsError.message);
        const studentIds = (classStudents ?? []).map((s) => s.id);
        if (studentIds.length === 0) return [];

        // Then fetch marks only for students in this class
        const { data, error } = await supabase
            .from('exam_marks')
            .select('*, students(full_name, roll_number), subjects(name)')
            .eq('exam_id', examId)
            .in('student_id', studentIds)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return (data ?? []) as MarkWithDetails[];
    },

    upsertMarks: async (marks: MarkEntry[]): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from('exam_marks')
            .upsert(marks, { onConflict: 'exam_id,student_id,subject_id' });
        if (error) throw new Error(error.message);
    },
};
