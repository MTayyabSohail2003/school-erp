import { z } from 'zod';

export const studentSchema = z.object({
    id: z.string().uuid().optional(),
    roll_number: z.string().min(1, { message: 'Roll number is required' }),
    full_name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LEAVER', 'GRADUATED']).default('ACTIVE').optional(),
    date_of_birth: z.string()
        .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' })
        .refine((date) => {
            const age = new Date().getFullYear() - new Date(date).getFullYear();
            return age >= 2 && age <= 25; // Industry standard range for school
        }, { message: 'Student must be between 2 and 25 years old' }),
    class_id: z.string().min(1, { message: 'Select a valid class' }),
    parent_id: z.string().min(1, { message: 'Select a valid parent' }),
    b_form_id: z.string().min(5, { message: 'B-Form ID is required for verification' }),
    academic_year: z.string().min(4, { message: 'Academic Year is required (e.g. 2025)' }),
    b_form_url: z.string().url().optional().nullable(),
    old_cert_url: z.string().url().optional().nullable(),
    photo_url: z.string().url().optional().nullable(),
    monthly_fee: z.number().min(0, { message: 'Monthly fee is required' }),
    created_at: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;

export const studentFormSchema = studentSchema.omit({
    id: true,
    created_at: true,
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

export const bulkStudentFormSchema = z.object({
    class_id: z.string().min(1, 'Select a valid class'),
    students: z.array(
        studentFormSchema.omit({ class_id: true, b_form_id: true }).extend({
            b_form_id: z.string().optional().nullable().or(z.literal(''))
        })
    ).min(1, 'Add at least one student'),
});

export type BulkStudentFormData = z.infer<typeof bulkStudentFormSchema>;

export const promoteStudentsSchema = z.object({
    student_ids: z.array(z.string().uuid()).min(1, 'Select at least one student'),
    source_class_id: z.string().uuid('Invalid source class'),
    destination_class_id: z.string().uuid('Invalid destination class').optional().nullable(),
    new_academic_year: z.string().min(4, 'New academic year is required'),
    is_graduation: z.boolean().default(false),
}).refine((data) => {
    if (data.is_graduation) return true;
    return !!data.destination_class_id && data.source_class_id !== data.destination_class_id;
}, {
    message: "Destination class is required for promotion",
    path: ["destination_class_id"],
});

export type PromoteStudentsData = z.infer<typeof promoteStudentsSchema>;

export const batchPromoteSchema = z.object({
    mappings: z.array(z.object({
        source_class_id: z.string().uuid(),
        destination_class_id: z.string().uuid().nullable(),
        target_monthly_fee: z.number().min(0).optional(),
        is_graduation: z.boolean().default(false),
        excluded_student_ids: z.array(z.string().uuid()).default([]),
        roll_number_overrides: z.record(z.string(), z.string()).optional(), // studentId -> newRollNumber
    })).min(1, 'At least one class mapping is required'),
    new_academic_year: z.string().min(4, 'New academic year is required'),
});


export type BatchPromoteData = z.infer<typeof batchPromoteSchema>;

