import { createClient } from '@/lib/supabase/client';

export type ClassRecord = {
    id: string;
    name: string;
    section: string | null;
    class_teacher_id: string | null;
    is_primary: boolean;
};

export const classesApi = {
    /**
     * Pure function to fetch all available classes.
     */
    getClasses: async (): Promise<ClassRecord[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('classes')
            .select('id, name, section, class_teacher_id, is_primary')
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Fetches only those classes where a teacher is involved (In-charge or Period teacher).
     */
    getTeacherClasses: async (teacherId: string): Promise<ClassRecord[]> => {
        const supabase = createClient();
        
        // 1. Classes where teacher is in-charge
        const { data: inCharge, error: err1 } = await supabase
            .from('classes')
            .select('id, name, section, class_teacher_id, is_primary')
            .eq('class_teacher_id', teacherId);

        // 2. Classes where teacher has periods
        const { data: periods, error: err2 } = await supabase
            .from('timetable')
            .select('class_id, classes(id, name, section, class_teacher_id, is_primary)')
            .eq('teacher_id', teacherId);

        if (err1 || err2) throw new Error(err1?.message || err2?.message);

        const classMap = new Map<string, ClassRecord>();
        (inCharge ?? []).forEach(c => classMap.set(c.id, c));
        (periods ?? []).forEach(p => {
            const classesRaw = p.classes as unknown as ClassRecord | ClassRecord[];
            const c = Array.isArray(classesRaw) ? classesRaw[0] : (classesRaw as ClassRecord);
            if (c) classMap.set(c.id, c);
        });

        return Array.from(classMap.values()).sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
            if (numA === numB) return a.name.localeCompare(b.name);
            return numA - numB;
        });
    },

    /**
     * Pure function to create a new class.
     */
    createClass: async (classData: { name: string; section?: string | null; class_teacher_id?: string | null; is_primary?: boolean }): Promise<ClassRecord> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('classes')
            .insert([
                {
                    name: classData.name,
                    section: classData.section,
                    class_teacher_id: classData.class_teacher_id || null,
                    is_primary: classData.is_primary ?? false,
                }
            ])
            .select('id, name, section, class_teacher_id, is_primary')
            .single();

        if (error) {
            // Handle the unique constraint violation (name, section)
            if (error.code === '23505') throw new Error(`Class ${classData.name} - Section ${classData.section} already exists.`);
            throw new Error(error.message);
        }

        return data;
    },

    /**
     * Soft-deletes a class by ID (hard delete — classes should only be deleted if no students enrolled).
     */
    deleteClass: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) {
            if (error.code === '23503') {
                if (error.message.includes('students')) {
                    throw new Error('Cannot delete this class: Active students are currently enrolled. Please reassign or remove them first.');
                }
                if (error.message.includes('timetable')) {
                    throw new Error('Cannot delete this class: It has an active timetable. Please clear the timetable first.');
                }
                throw new Error('Cannot delete this class because it is linked to other active records.');
            }
            throw new Error(error.message);
        }
    },

    /**
     * Updates an existing class.
     */
    updateClass: async (id: string, updates: Partial<ClassRecord>): Promise<ClassRecord> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('classes')
            .update(updates)
            .eq('id', id)
            .select('id, name, section, class_teacher_id, is_primary')
            .single();

        if (error) throw new Error(error.message);
        return data;
    },
};
