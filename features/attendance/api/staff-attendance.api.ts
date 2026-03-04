import { createClient } from '@/lib/supabase/client';
import { type StaffAttendanceRecord, type StaffAttendanceWithUser } from '../schemas/staff-attendance.schema';

export const staffAttendanceApi = {
    /**
     * Fetch all staff attendance records for a specific date.
     * Joins with users to get name/email for display.
     */
    getStaffAttendanceByDate: async (
        date: string
    ): Promise<StaffAttendanceWithUser[]> => {
        const supabase = createClient();

        // Get all active staff members
        const { data: staff, error: staffError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('role', 'TEACHER')
            .order('full_name', { ascending: true });

        if (staffError) throw new Error(staffError.message);

        // Get existing attendance records for this date
        const { data: records, error: recordsError } = await supabase
            .from('staff_attendance')
            .select('*, users(full_name, email)')
            .eq('record_date', date)
            .in('user_id', (staff ?? []).map((s) => s.id));

        if (recordsError) throw new Error(recordsError.message);

        return (records ?? []) as StaffAttendanceWithUser[];
    },

    /**
     * Bulk upsert staff attendance.
     */
    upsertStaffAttendance: async (records: StaffAttendanceRecord[]): Promise<void> => {
        const supabase = createClient();

        const { error } = await supabase
            .from('staff_attendance')
            .upsert(records, { onConflict: 'user_id,record_date' });

        if (error) throw new Error(error.message);
    },
};
