import { z } from 'zod';

export const ATTENDANCE_STATUS = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LEAVE: 'LEAVE',
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

export const attendanceRecordSchema = z.object({
    student_id: z.string().uuid(),
    record_date: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT', 'LEAVE']),
    marked_by: z.string().uuid().optional(),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

// Shape returned from the DB: includes student name for display
export type AttendanceWithStudent = {
    id: string;
    student_id: string;
    record_date: string;
    status: AttendanceStatus;
    marked_by: string | null;
    students: {
        full_name: string;
        roll_number: string;
    };
};
