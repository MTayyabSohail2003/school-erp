import { createClient } from '@/lib/supabase/client';

export type ClassRecord = {
    id: string;
    name: string;
    section: string;
};

export const classesApi = {
    /**
     * Pure function to fetch all available classes.
     */
    getClasses: async (): Promise<ClassRecord[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('classes')
            .select('id, name, section')
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Pure function to create a new class.
     */
    createClass: async (classData: { name: string; section: string }): Promise<ClassRecord> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('classes')
            .insert([
                {
                    name: classData.name,
                    section: classData.section,
                }
            ])
            .select('id, name, section')
            .single();

        if (error) {
            // Handle the unique constraint violation (name, section)
            if (error.code === '23505') throw new Error(`Class ${classData.name} - Section ${classData.section} already exists.`);
            throw new Error(error.message);
        }

        return data;
    }
};
