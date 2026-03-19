import { z } from 'zod';

export const classSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, { message: 'Class name is required (e.g. Class 10)' }),
    section: z.string().optional().nullable(),
    class_teacher_id: z.string().uuid().optional().nullable(),
    is_primary: z.boolean().default(false).optional(),
    created_at: z.string().optional(),
});

export type Class = z.infer<typeof classSchema>;

export const classFormSchema = classSchema.omit({
    id: true,
    created_at: true,
}).refine(data => {
    if (data.is_primary && !data.class_teacher_id) return false;
    return true;
}, {
    message: "Class Teacher is required for Primary Mode classes",
    path: ["class_teacher_id"]
});

export type ClassFormData = z.infer<typeof classFormSchema>;
