'use server';

import { createClient } from '@supabase/supabase-js';

// Use Admin API to completely delete Auth users
const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function deleteStaffAction(userId: string) {
    try {
        if (!supabaseAdminKey) {
            return {
                success: false,
                error: 'Server Misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY'
            };
        }

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Delete from Auth (This will cascade delete from public.users and public.teacher_profiles
        // if ON DELETE CASCADE is set up correctly in the database schema)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            // Fallback: Try to delete from the public.users table directly if Auth deletion fails 
            // (e.g. if the user doesn't exist in Auth but exists in public table for some reason)
            const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', userId);
            if (dbError) throw new Error(dbError.message);
        }

        return { success: true, message: 'Teacher successfully deleted.' };

    } catch (error: any) {
        console.error('Delete Staff Action Error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
