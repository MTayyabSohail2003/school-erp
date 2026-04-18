import { createClient } from '@/lib/supabase/client';
import { type Term, type ResultEntry, type ResultWithDetails } from '../schemas/results.schema';

export const resultsApi = {
    getTerms: async (): Promise<Term[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_terms')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []) as Term[];
    },

    getStudentsByClass: async (classId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('students')
            .select('id, full_name, roll_number, photo_url')
            .eq('class_id', classId)
            .eq('status', 'ACTIVE')
            .order('full_name', { ascending: true });
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    getSubjectsByClass: async (classId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select('id, name, code')
            .eq('class_id', classId)
            .order('name', { ascending: true });
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    getResultsByTermAndStudent: async (termId: string, studentId: string): Promise<ResultWithDetails[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_results')
            .select(`
                *, 
                students(
                    full_name, 
                    roll_number, 
                    date_of_birth, 
                    photo_url, 
                    class_id,
                    users!students_parent_id_fkey(full_name)
                ), 
                subjects(name)
            `)
            .eq('term_id', termId)
            .eq('student_id', studentId);
        if (error) throw new Error(error.message);
        return (data ?? []) as any[];
    },

    getResultsByTermAndClass: async (termId: string, classId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_results')
            .select('*, students!inner(id, full_name, roll_number)')
            .eq('term_id', termId)
            .eq('students.class_id', classId);
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    getTermInstance: async (name: string, year: string): Promise<Term> => {
        const supabase = createClient();
        
        // 1. Try to find existing
        const { data: existing, error: findError } = await supabase
            .from('exam_terms')
            .select('*')
            .eq('name', name)
            .eq('academic_year', year)
            .maybeSingle();
            
        if (existing) return existing as Term;
        
        // 2. Create if not found
        const { data: created, error: createError } = await supabase
            .from('exam_terms')
            .insert({ name, academic_year: year, is_active: true })
            .select()
            .single();
            
        if (createError) throw new Error(createError.message);
        return created as Term;
    },

    upsertResults: async (results: ResultEntry[]) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('exam_results')
            .upsert(results, { onConflict: 'term_id,student_id,subject_id' });
        if (error) throw new Error(error.message);
    },

    createTerm: async (term: Omit<Term, 'id' | 'created_at'>) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_terms')
            .insert(term)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data as Term;
    },

    updateTerm: async (id: string, term: Partial<Term>) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_terms')
            .update(term)
            .eq('id', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data as Term;
    },

    deleteTerm: async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('exam_terms')
            .delete()
            .eq('id', id);
        if (error) throw new Error(error.message);
    },

    getStudentDetails: async (studentId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('students')
            .select(`
                id, 
                full_name, 
                roll_number, 
                date_of_birth, 
                photo_url, 
                class_id,
                users!students_parent_id_fkey(full_name)
            `)
            .eq('id', studentId)
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};
