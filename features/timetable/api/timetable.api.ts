import { createClient } from '@/lib/supabase/client';
import { type TimetableEntry, type TimetableWithDetails } from '../schemas/timetable.schema';

export const timetableApi = {
    getClassTimetable: async (classId: string, academicYear: string): Promise<TimetableWithDetails[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timetable')
            .select(`
                *,
                classes (name, section),
                users (full_name),
                subjects (name, code),
                periods (name, start_time, end_time, order_index)
            `)
            .eq('class_id', classId)
            .eq('academic_year', academicYear);

        if (error) throw new Error(error.message);
        return data as TimetableWithDetails[];
    },

    getTeacherTimetable: async (teacherId: string, academicYear: string): Promise<TimetableWithDetails[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timetable')
            .select(`
                *,
                classes (name, section),
                users (full_name),
                subjects (name, code),
                periods (name, start_time, end_time, order_index)
            `)
            .eq('teacher_id', teacherId)
            .eq('academic_year', academicYear);

        if (error) throw new Error(error.message);
        return data as TimetableWithDetails[];
    },

    upsertTimetableEntry: async (entry: TimetableEntry): Promise<TimetableWithDetails> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timetable')
            .upsert(entry)
            .select(`
                *,
                classes (name, section),
                users (full_name),
                subjects (name, code),
                periods (name, start_time, end_time, order_index)
            `)
            .single();

        if (error) throw new Error(error.message);
        return data as TimetableWithDetails;
    },

    bulkUpsertTimetable: async (entries: TimetableEntry[]): Promise<TimetableWithDetails[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timetable')
            .upsert(entries)
            .select(`
                *,
                classes (name, section),
                users (full_name),
                subjects (name, code),
                periods (name, start_time, end_time, order_index)
            `);

        if (error) throw new Error(error.message);
        return data as TimetableWithDetails[];
    },

    deleteTimetableEntry: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from('timetable')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    getAllTimetable: async (academicYear: string): Promise<TimetableWithDetails[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timetable')
            .select(`
                *,
                classes (name, section),
                users (full_name),
                subjects (name, code),
                periods (name, start_time, end_time, order_index)
            `)
            .eq('academic_year', academicYear);

        if (error) throw new Error(error.message);
        return data as TimetableWithDetails[];
    }
};
