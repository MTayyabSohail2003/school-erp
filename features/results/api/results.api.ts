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
                subjects(name),
                classes(name, section)
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
            .select('*, students(id, full_name, roll_number)')
            .eq('term_id', termId)
            .eq('class_id', classId);
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
        const BATCH_SIZE = 500;

        for (let i = 0; i < results.length; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from('exam_results')
                .upsert(batch, { onConflict: 'term_id,student_id,subject_id' });
            if (error) throw new Error(error.message);
        }
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

    updateTermNames: async (oldName: string, newName: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_terms')
            .update({ name: newName })
            .eq('name', oldName)
            .select();

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            throw new Error(`Term "${oldName}" not found or no changes made.`);
        }
    },

    deleteTerm: async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('exam_terms')
            .delete()
            .eq('id', id);
        if (error) throw new Error(error.message);
    },

    deleteTermsByName: async (name: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('exam_terms')
            .delete()
            .eq('name', name);
        if (error) throw new Error(error.message);
    },

    deleteTermsByYear: async (year: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('exam_terms')
            .delete()
            .eq('academic_year', year);
        if (error) throw new Error(error.message);
    },

    updateAcademicYear: async (oldYear: string, newYear: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_terms')
            .update({ academic_year: newYear })
            .eq('academic_year', oldYear)
            .select();

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            throw new Error(`Session "${oldYear}" not found or no changes made.`);
        }
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
    },

    getMetadataUsage: async (): Promise<string[]> => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_used_term_ids');
        if (error) throw new Error(error.message);
        return (data ?? []) as string[];
    },

    getAllResultsByStudent: async (studentId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exam_results')
            .select(`
                *,
                subjects(name, code),
                classes(name, section),
                exam_terms!inner(id, name, academic_year)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    getArchiveStudents: async (classId?: string, status?: string) => {
        const supabase = createClient();
        
        // 1. Fetch current students matching filters
        let query = supabase
            .from('students')
            .select('id, full_name, roll_number, photo_url, status, classes(id, name, section)');
            
        if (status && status !== 'ALL') {
            query = query.eq('status', status);
        }
        if (classId && classId !== 'ALL') {
            query = query.eq('class_id', classId);
        }
        
        const { data: currentStudents, error: currentError } = await query;
        if (currentError) throw new Error(currentError.message);
        
        // 2. If a specific class is selected, also find students who have results in that class (historical)
        let historicalStudents: any[] = [];
        if (classId && classId !== 'ALL') {
            const { data: resultsStudents, error: resultsError } = await supabase
                .from('exam_results')
                .select(`
                    students(id, full_name, roll_number, photo_url, status, classes(id, name, section))
                `)
                .eq('class_id', classId);
                
            if (!resultsError && resultsStudents) {
                historicalStudents = resultsStudents.map(r => r.students).filter(Boolean);
            }
        }
        
        // 3. Combine and de-duplicate by ID
        const combined = [...(currentStudents || []), ...historicalStudents];
        const uniqueMap = new Map();
        combined.forEach(s => {
            if (!uniqueMap.has(s.id)) uniqueMap.set(s.id, s);
        });
        
        return Array.from(uniqueMap.values());
    }
};
