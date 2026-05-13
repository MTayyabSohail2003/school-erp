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

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey);

        // 1. Delete from public.users directly (cascades to teacher_profiles)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (dbError) {
            throw new Error(`Failed to delete staff record: ${dbError.message}`);
        }

        // 2. Attempt to delete from Auth (Optional/Cleanup)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (authError && !authError.message.includes('User not found')) {
            console.warn('Optional Staff Auth deletion failed:', authError.message);
        }

        return { success: true, message: 'Teacher successfully deleted.' };

    } catch (error: unknown) {
        console.error('Delete Staff Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
