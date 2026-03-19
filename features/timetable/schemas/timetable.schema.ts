import { z } from 'zod';

export const timetableEntrySchema = z.object({
    id: z.string().uuid().optional(),
    class_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    subject_id: z.string().uuid().nullable(),
    period_id: z.string().uuid(),
    day_of_week: z.number().min(1).max(6), // 1 = Monday, ..., 6 = Saturday
    academic_year: z.string().min(1),
});

export type TimetableEntry = z.infer<typeof timetableEntrySchema>;

// With joined relational data for UI rendering
export type TimetableWithDetails = TimetableEntry & {
    id: string; // Guaranteed to be present when drawn from DB
    classes?: { name: string; section: string };
    users?: { full_name: string }; // Teacher
    subjects?: { name: string; code: string };
    periods?: { name: string; start_time: string; end_time: string; order_index: number };
};
