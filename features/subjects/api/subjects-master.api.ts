import { createClient } from '@/lib/supabase/client';

export type SubjectMaster = {
    id: string;
    name: string;
    code: string | null;
    created_at: string;
};

export const subjectsMasterApi = {
    getSubjects: async (): Promise<SubjectMaster[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects_master')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        return data as SubjectMaster[];
    },

    createSubject: async (name: string, code: string | null): Promise<SubjectMaster> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects_master')
            .insert([{ name, code }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as SubjectMaster;
    },

    bulkCreateSubjects: async (subjects: { name: string; code: string | null }[]): Promise<SubjectMaster[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects_master')
            .insert(subjects)
            .select();

        if (error) throw new Error(error.message);
        return data as SubjectMaster[];
    },

    deleteSubject: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from('subjects_master')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
