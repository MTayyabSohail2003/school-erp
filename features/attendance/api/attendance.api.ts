import { createClient } from '@/lib/supabase/client';
import { type AttendanceRecord, type AttendanceWithStudent } from '../schemas/attendance.schema';

export const attendanceApi = {
    /**
     * Fetch all attendance records for a specific class on a specific date.
     * Joins with students to get name/roll_number for display.
     */
    getAttendanceByClassAndDate: async (
        classId: string,
        date: string
    ): Promise<AttendanceWithStudent[]> => {
        const supabase = createClient();

        // Get all students in the class
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, full_name, roll_number')
            .eq('class_id', classId)
            .order('roll_number', { ascending: true });

        if (studentsError) throw new Error(studentsError.message);

        // Get existing attendance records for this date
        const { data: records, error: recordsError } = await supabase
            .from('attendance')
            .select('*, students(full_name, roll_number)')
            .eq('record_date', date)
            .in('student_id', (students ?? []).map((s) => s.id));

        if (recordsError) throw new Error(recordsError.message);

        return (records ?? []) as AttendanceWithStudent[];
    },

    /**
     * Fetch all attendance records for a specific student.
     * Useful for parent/student portals.
     */
    getAttendanceByStudent: async (studentId: string): Promise<AttendanceRecord[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('record_date', { ascending: false })
            .limit(30);

        if (error) throw new Error(error.message);
        return data as AttendanceRecord[];
    },
 
    /**
     * Fetch attendance records for multiple students on a specific date.
     * Useful for parent portal's daily view.
     */
    getAttendanceByStudentsAndDate: async (
        studentIds: string[],
        date: string
    ): Promise<AttendanceRecord[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .in('student_id', studentIds)
            .eq('record_date', date);
 
        if (error) throw new Error(error.message);
        return data as AttendanceRecord[];
    },
 
    /**
     * Bulk upsert attendance — one record per student for the given date.
     * Uses composite unique key (student_id, record_date) for conflict resolution.
     */
    upsertAttendance: async (records: AttendanceRecord[]): Promise<void> => {
        const supabase = createClient();

        const { error } = await supabase
            .from('attendance')
            .upsert(records, { onConflict: 'student_id,record_date' });

        if (error) throw new Error(error.message);
    },
};
