import { z } from 'zod';

export const examFormSchema = z.object({
    title: z.string().min(3, { message: 'Exam title must be at least 3 characters' }),
    start_date: z.string().min(1, { message: 'Start date is required' }),
    end_date: z.string().min(1, { message: 'End date is required' }),
});

export type ExamFormData = z.infer<typeof examFormSchema>;

export type Exam = ExamFormData & {
    id: string;
    created_at: string;
};
