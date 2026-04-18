import { z } from 'zod';

export const termSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, 'Term name is required'),
    academic_year: z.string().min(4, 'Academic year is required'),
    is_active: z.boolean().default(true),
    created_at: z.string().optional(),
});

export type Term = z.infer<typeof termSchema>;

export const resultEntrySchema = z.object({
    term_id: z.string().uuid(),
    student_id: z.string().uuid(),
    subject_id: z.string().uuid(),
    obtained_marks: z.number().min(0, 'Obtained marks cannot be negative'),
    total_marks: z.number().min(1, 'Total marks must be at least 1'),
    grade: z.string().min(1, 'Grade is required'),
    percentage: z.number().min(0).max(100),
});

export type ResultEntry = z.infer<typeof resultEntrySchema>;

export type ResultWithDetails = ResultEntry & {
    id: string;
    created_at: string;
    students: { 
        full_name: string; 
        roll_number: string; 
        photo_url?: string; 
        date_of_birth?: string;
        users?: { full_name: string } 
    };
    subjects: { name: string };
};

export const GRADE_THRESHOLDS = [
    { min: 85, grade: 'A' },
    { min: 70, grade: 'B' },
    { min: 55, grade: 'C' },
    { min: 40, grade: 'D' },
    { min: 0, grade: 'F' },
] as const;

export const calculateGradeAndPercentage = (obtained: number, total: number) => {
    const percentage = total > 0 ? (obtained / total) * 100 : 0;
    const grade = GRADE_THRESHOLDS.find((t) => percentage >= t.min)?.grade ?? 'F';
    return { percentage: Math.round(percentage * 100) / 100, grade };
};
