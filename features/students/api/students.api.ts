import { createClient } from '@/lib/supabase/client';
import { type StudentFormData, type Student } from '../schemas/student.schema';

export const studentsApi = {
    /**
     * Pure function to fetch all students with their class details.
     */
    getStudents: async (options?: { parentId?: string, classIds?: string[] }): Promise<(Student & { classes: { name: string; section: string }, users: { full_name: string } })[]> => {
        const supabase = createClient();
        let query = supabase
            .from('students')
            .select('*, classes(name, section), users!students_parent_id_fkey(full_name)')
            .eq('status', 'ACTIVE');

        if (options?.parentId) {
            query = query.eq('parent_id', options.parentId);
        }

        if (options?.classIds && options.classIds.length > 0) {
            query = query.in('class_id', options.classIds);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        
        // Normalize joined data (Supabase can return arrays for joins depending on schema/hints)
        return (data || []).map((student) => ({
            ...student,
            classes: Array.isArray(student.classes) ? student.classes[0] : student.classes,
            users: Array.isArray(student.users) ? student.users[0] : student.users,
        })) as (Student & { classes: { name: string; section: string }, users: { full_name: string } })[];
    },

    /**
     * Pure function to create a new student.
     */
    createStudent: async (student: StudentFormData): Promise<Student> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('students')
            .insert([
                {
                    roll_number: student.roll_number,
                    full_name: student.full_name,
                    status: student.status || 'ACTIVE',
                    date_of_birth: student.date_of_birth,
                    class_id: student.class_id,
                    parent_id: student.parent_id || null,
                    b_form_url: student.b_form_url,
                    old_cert_url: student.old_cert_url,
                    photo_url: student.photo_url,
                    monthly_fee: student.monthly_fee,
                }
            ])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') throw new Error('A student with this Roll Number already exists.');
            throw new Error(error.message);
        }

        return data;
    }
};
