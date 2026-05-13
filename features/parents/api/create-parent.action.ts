'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendEmail } from '@/lib/mail';

const createParentSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Invalid email address.'),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits.'),
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

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey);

        // 1. Validate the input purely on the server again
        const parsed = createParentSchema.parse(data);
        const sanitizedEmail = parsed.email.trim().toLowerCase();

        // 2. Generate a new UUID and insert directly into public.users
        // We no longer create an Auth account or send emails.
        const newUserId = crypto.randomUUID();

        const { error: userError } = await supabaseAdmin.from('users').upsert({
            id: newUserId,
            email: sanitizedEmail,
            full_name: parsed.full_name,
            phone_number: parsed.phone_number,
            role: 'PARENT',
            status: 'ACTIVE',
        }, {
            onConflict: 'email' // Allow updating existing data if email matches
        });

        if (userError) {
            console.error('User Table Error Detail:', JSON.stringify(userError, null, 2));
            throw new Error(`User Table Error: ${userError.message}`);
        }

        return {
            success: true,
            message: 'Parent record saved successfully (No account created).',
            parent: {
                id: newUserId,
                full_name: parsed.full_name,
                email: sanitizedEmail,
            }
        };

    } catch (error: unknown) {
        console.error('Create Parent Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
