'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const createParentSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Invalid email address.'),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export type CreateParentFormData = z.infer<typeof createParentSchema>;

export async function createParentAction(data: CreateParentFormData) {
    try {
        const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseAdminUrl || !supabaseAdminKey) {
            return {
                success: false,
                error: 'Server Misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY in .env file.'
            };
        }

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // 1. Validate the input purely on the server again
        const parsed = createParentSchema.parse(data);

        // 2. Create the user in Supabase Auth using the Admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: parsed.email,
            password: parsed.password,
            email_confirm: true,
            user_metadata: {
                full_name: parsed.full_name,
                role: 'PARENT',
            },
        });

        if (authError) throw new Error(`Auth Error: ${authError.message}`);
        if (!authData.user) throw new Error('User creation failed, no user returned.');

        const newUserId = authData.user.id;

        // 3. Insert into the public.users table
        const { error: userError } = await supabaseAdmin.from('users').upsert({
            id: newUserId,
            email: parsed.email,
            full_name: parsed.full_name,
            phone_number: parsed.phone_number,
            role: 'PARENT',
            status: 'ACTIVE',
        });

        if (userError) {
            // Rollback Auth creation if custom table insert fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            throw new Error(`User Table Error: ${userError.message}`);
        }

        return {
            success: true,
            message: 'Parent successfully created.',
            parent: {
                id: newUserId,
                full_name: parsed.full_name,
                email: parsed.email,
            }
        };

    } catch (error: unknown) {
        console.error('Create Parent Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
