import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { attendanceApi } from './attendance.api';
import { type AttendanceRecord } from '../schemas/attendance.schema';
import { ATTENDANCE_QUERY_KEY } from './use-get-attendance';

const sendAbsenceNotification = async (record: AttendanceRecord): Promise<void> => {
    if (record.status !== 'ABSENT') return;

    const supabase = createClient();

    // Fetch the student with their parent_id
    const { data: student } = await supabase
        .from('students')
        .select('full_name, parent_id')
        .eq('id', record.student_id)
        .single();

    if (!student?.parent_id) return;

    const date = record.record_date ?? new Date().toISOString().slice(0, 10);

    await supabase.from('notifications').insert({
        recipient_id: student.parent_id,
        title: 'Absence Notice',
        message: `${student.full_name} was marked ABSENT on ${date}. Please contact the school if this was unexpected.`,
        is_read: false,
    });
};

export const useUpsertAttendance = (classId: string, date: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (records: AttendanceRecord[]) => {
            // 1. Save attendance records
            await attendanceApi.upsertAttendance(records);

            // 2. Fire notifications for each ABSENT student (non-blocking)
            const absentRecords = records.filter(r => r.status === 'ABSENT');
            await Promise.allSettled(absentRecords.map(sendAbsenceNotification));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY(classId, date) });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
