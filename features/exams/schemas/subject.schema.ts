import { z } from 'zod';

export const subjectFormSchema = z.object({
    name: z.string().min(2, { message: 'Subject name must be at least 2 characters' }),
    class_id: z.string().uuid({ message: 'Class is required' }),
});

export type SubjectFormData = z.infer<typeof subjectFormSchema>;

export type Subject = SubjectFormData & {
    id: string;
    created_at: string;
};
