import { z } from 'zod';

export const classSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, { message: 'Class name is required (e.g. Class 10)' }),
    section: z.string().min(1, { message: 'Section is required (e.g. A)' }),
    class_teacher_id: z.string().uuid().optional().nullable(),
    is_primary: z.boolean().default(false).optional(),
    created_at: z.string().optional(),
});

export type Class = z.infer<typeof classSchema>;

export const classFormSchema = classSchema.omit({
    id: true,
    created_at: true,
});

export type ClassFormData = z.infer<typeof classFormSchema>;
