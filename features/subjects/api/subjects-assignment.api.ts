import { createClient } from '@/lib/supabase/client';
import { type Subject, type SubjectAssignmentWithClass } from './subjects.api';

export const subjectsAssignmentApi = {
    getClassSubjects: async (classId: string): Promise<Subject[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('class_id', classId)
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        return data as Subject[];
    },

    bulkAssignSubjects: async (classId: string, masterIds: string[], masterSubjects: { id: string; name: string; code: string | null }[]): Promise<void> => {
        const supabase = createClient();
        
        // We insert into 'subjects' (assignments) based on the master pool
        const assignments = masterIds.map(masterId => {
            const master = masterSubjects.find(m => m.id === masterId);
            return {
                class_id: classId,
                master_id: masterId,
                name: master?.name || 'Unknown',
                code: master?.code || null
            };
        });

        const { error } = await supabase
            .from('subjects')
            .insert(assignments);

        if (error) throw new Error(error.message);
    },

    deleteAssignment: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    getAllAssignments: async (): Promise<SubjectAssignmentWithClass[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select(`
                id,
                name,
                code,
                class_id,
                classes:class_id (
                    name,
                    section
                )
            `)
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        
        type RawAssignment = Subject & { 
            class_id: string; 
            classes: { name: string; section: string } | { name: string; section: string }[] | null 
        };

        return (data as RawAssignment[]).map(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            class_id: item.class_id,
            classes: Array.isArray(item.classes) ? item.classes[0] : item.classes
        }));
    }
};
