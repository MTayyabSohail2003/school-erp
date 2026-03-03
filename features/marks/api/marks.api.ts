import { createClient } from '@/lib/supabase/client';
import { type MarkEntry, type MarkWithDetails } from '../schemas/mark.schema';

export const marksApi = {
    getMarksByExamAndClass: async (examId: string, classId: string): Promise<MarkWithDetails[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_marks')
            .select('*, students(full_name, roll_number), subjects(name)')
            .eq('exam_id', examId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);

        // Filter to students in the selected class by joining through students
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
