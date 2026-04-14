import { z } from 'zod';

export const staffSchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    full_name: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone_number: z.string().optional().nullable(),
    qualification: z.string().min(2, { message: 'Qualification is required' }),
    monthly_salary: z.number().min(0, { message: 'Salary must be a positive number' }),
    resume_url: z.string().url().optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LEAVER']).default('ACTIVE').optional(),
    created_at: z.string().optional(),
});

export type Staff = z.infer<typeof staffSchema>;

// Password is required when creating a new teacher account
export const staffFormSchema = staffSchema.omit({
    id: true,
    user_id: true,
    created_at: true,
}).extend({
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export type StaffFormData = z.infer<typeof staffFormSchema>;

export const staffUpdateSchema = staffSchema.omit({
    id: true,
    user_id: true,
    created_at: true,
    email: true, // Typically, email isn't updated lightly 
});

export type StaffUpdateData = z.infer<typeof staffUpdateSchema>;
