import { z } from 'zod';

export const GRADE_THRESHOLDS = [
    { min: 85, grade: 'A' },
    { min: 70, grade: 'B' },
    { min: 55, grade: 'C' },
    { min: 40, grade: 'D' },
    { min: 0, grade: 'F' },
] as const;

export const calculateGrade = (obtained: number, total: number): string => {
    const percentage = total > 0 ? (obtained / total) * 100 : 0;
    return GRADE_THRESHOLDS.find((t) => percentage >= t.min)?.grade ?? 'F';
};

export const markEntrySchema = z.object({
    exam_id: z.string().uuid(),
    student_id: z.string().uuid(),
    subject_id: z.string().uuid(),
    marks_obtained: z.number().min(0),
    total_marks: z.number().min(1),
    grade: z.string(),
});

export type MarkEntry = z.infer<typeof markEntrySchema>;

export type MarkWithDetails = MarkEntry & {
    id: string;
    created_at: string;
    students: { full_name: string; roll_number: string };
    subjects: { name: string };
};
