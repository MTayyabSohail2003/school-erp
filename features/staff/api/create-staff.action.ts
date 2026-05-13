'use server';

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/mail';
import { StaffFormData, staffFormSchema } from '../schemas/staff.schema';

// We must use the SERVICE_ROLE_KEY to bypass RLS and create Auth users
// without logging the current Admin out of their session.

export async function createStaffAction(data: StaffFormData) {
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
        const parsed = staffFormSchema.parse(data);
        const sanitizedEmail = parsed.email.trim().toLowerCase();

        // 2. Generate a new UUID and insert directly into public.users
        const newUserId = crypto.randomUUID();

        const { error: userError } = await supabaseAdmin.from('users').upsert({
            id: newUserId,
            email: sanitizedEmail,
            full_name: parsed.full_name,
            phone_number: parsed.phone_number,
            avatar_url: parsed.avatar_url || null,
            role: 'TEACHER',
            status: parsed.status || 'ACTIVE',
        }, {
            onConflict: 'email'
        });

        if (userError) {
            console.error('User Table Error Detail:', JSON.stringify(userError, null, 2));
            throw new Error(`User Table Error: ${userError.message}`);
        }

        // 3. Insert into the public.teacher_profiles table
        const { error: profileError } = await supabaseAdmin.from('teacher_profiles').insert({
            user_id: newUserId,
            qualification: parsed.qualification,
            monthly_salary: parsed.monthly_salary,
            resume_url: parsed.resume_url || null,
        });

        if (profileError) {
            console.error('Profile Table Error Detail:', JSON.stringify(profileError, null, 2));
            throw new Error(`Profile Error: ${profileError.message}`);
        }
 
        return { success: true, message: 'Teacher record saved successfully (No account created).' };

    } catch (error: unknown) {
        console.error('Create Staff Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
