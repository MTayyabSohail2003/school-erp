'use server';

import { createClient } from '@supabase/supabase-js';
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

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        // 1. Validate the input purely on the server again
        const parsed = staffFormSchema.parse(data);

        // 2. Create the user in Supabase Auth using the Admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: parsed.email,
            password: parsed.password,
            email_confirm: true,
            user_metadata: {
                full_name: parsed.full_name,
                role: 'TEACHER', // Hardcoding Teacher role for staff for now
            },
        });

        if (authError) throw new Error(`Auth Error: ${authError.message}`);
        if (!authData.user) throw new Error('User creation failed, no user returned.');

        const newUserId = authData.user.id;

        // 3. Insert into the public.users table (though a trigger might be doing this if you set one up,
        // but since we are handling role explicitely, let's insert or update it).
        // If we don't have a trigger, we must insert. If we do, we might need to just update the role.
        // Assuming we need to insert/update.
        const { error: userError } = await supabaseAdmin.from('users').upsert({
            id: newUserId,
            email: parsed.email,
            full_name: parsed.full_name,
            phone_number: parsed.phone_number,
            role: 'TEACHER',
        });

        if (userError) {
            // Rollback Auth creation if custom table insert fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            throw new Error(`User Table Error: ${userError.message}`);
        }

        // 4. Insert into the public.teacher_profiles table
        const { error: profileError } = await supabaseAdmin.from('teacher_profiles').insert({
            user_id: newUserId,
            qualification: parsed.qualification,
            monthly_salary: parsed.monthly_salary,
        });

        if (profileError) {
            // Rollback both if profile fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            throw new Error(`Profile Error: ${profileError.message}`);
        }

        return { success: true, message: 'Teacher successfully created.' };

    } catch (error: any) {
        console.error('Create Staff Action Error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
