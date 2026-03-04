import { z } from 'zod';
import { type AttendanceStatus } from './attendance.schema';

export const staffAttendanceRecordSchema = z.object({
    user_id: z.string().uuid(),
    record_date: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT', 'LEAVE']),
    marked_by: z.string().uuid().optional(),
});

export type StaffAttendanceRecord = z.infer<typeof staffAttendanceRecordSchema>;

// Shape returned from the DB: includes staff name for display
export type StaffAttendanceWithUser = {
    id: string;
    user_id: string;
    record_date: string;
    status: AttendanceStatus;
    marked_by: string | null;
    users: {
        full_name: string;
        email: string;
    };
};
