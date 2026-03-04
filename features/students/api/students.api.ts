import { createClient } from '@/lib/supabase/client';
import { type StudentFormData, type Student } from '../schemas/student.schema';

export const studentsApi = {
    /**
     * Pure function to fetch all students with their class details.
     */
    getStudents: async (): Promise<(Student & { classes: { name: string; section: string } })[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('students')
            .select('*, classes(name, section)')
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data as any;
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
                    old_cert_url: student.old_cert_url,
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
