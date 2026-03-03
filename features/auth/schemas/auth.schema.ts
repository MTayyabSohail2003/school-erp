import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export const userSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'TEACHER', 'PARENT']),
    full_name: z.string(),
    phone_number: z.string().nullable(),
    created_at: z.string(),
});

export type UserProfile = z.infer<typeof userSchema>;
