import { createClient } from '@/lib/supabase/client';
import { type ExamFormData, type Exam } from '../schemas/exam.schema';
import { type SubjectFormData, type Subject } from '../schemas/subject.schema';

export const examsApi = {
    getExams: async (): Promise<Exam[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .order('start_date', { ascending: false });
        if (error) throw new Error(error.message);
        return data as Exam[];
    },

    createExam: async (exam: ExamFormData): Promise<Exam> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exams')
            .insert([exam])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data as Exam;
    },

    deleteExam: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('exams').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    getSubjectsByClass: async (classId: string): Promise<Subject[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('class_id', classId)
            .order('name', { ascending: true });
        if (error) throw new Error(error.message);
        return data as Subject[];
    },

    createSubject: async (subject: SubjectFormData): Promise<Subject> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .insert([subject])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data as Subject;
    },

    deleteSubject: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },
};
