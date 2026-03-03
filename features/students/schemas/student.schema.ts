import { z } from 'zod';

export const studentSchema = z.object({
    id: z.string().uuid().optional(),
    roll_number: z.string().min(1, { message: 'Roll number is required' }),
    full_name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    date_of_birth: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    class_id: z.string().uuid({ message: 'Select a valid class' }),
    parent_id: z.string().uuid().optional().nullable(),
    b_form_url: z.string().url().optional().nullable(),
    old_cert_url: z.string().url().optional().nullable(),
    created_at: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;

export const studentFormSchema = studentSchema.omit({
    id: true,
    created_at: true,
    parent_id: true, // Assigned separately by Admin if needed, or null initially
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

export const promoteStudentsSchema = z.object({
    source_class_id: z.string().uuid({ message: 'Select a valid source class' }),
    destination_class_id: z.string().uuid({ message: 'Select a valid destination class' }),
}).refine((data) => data.source_class_id !== data.destination_class_id, {
    message: "Source and destination classes cannot be the same",
    path: ["destination_class_id"],
});

export type PromoteStudentsData = z.infer<typeof promoteStudentsSchema>;
