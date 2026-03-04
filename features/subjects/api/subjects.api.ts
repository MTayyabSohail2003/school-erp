import { createClient } from '@/lib/supabase/client';

export type Subject = {
    id: string;
    name: string;
    code: string | null;
};

export const subjectsApi = {
    getSubjects: async (): Promise<Subject[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        return data as Subject[];
    },

    createSubject: async (name: string, code: string | null): Promise<Subject> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .insert([{ name, code }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Subject;
    },

    deleteSubject: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
