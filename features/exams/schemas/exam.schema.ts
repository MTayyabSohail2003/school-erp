import { z } from 'zod';

export const EXAM_TERMS = [
    { value: 'UNIT_TEST', label: 'Unit Test' },
    { value: 'MID_TERM', label: 'Mid-Term' },
    { value: 'FINAL_TERM', label: 'Final Term' },
] as const;

export type ExamTerm = typeof EXAM_TERMS[number]['value'];

export const examFormSchema = z.object({
    title: z.string().min(3, { message: 'Exam title must be at least 3 characters' }),
    start_date: z.string().min(1, { message: 'Start date is required' }),
    end_date: z.string().min(1, { message: 'End date is required' }),
    term: z.string(),
});

export type ExamFormData = z.infer<typeof examFormSchema>;

export type Exam = ExamFormData & {
    id: string;
    created_at: string;
};

