'use server';

import { createClient } from '@supabase/supabase-js';

export async function deleteParentAction(parentId: string) {
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

        // 1. Delete from public.users directly
        // This is now the primary deletion method since we are moving away from mandatory Auth accounts.
        const { error: userError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', parentId);

        if (userError) {
            throw new Error(`Failed to delete parent record: ${userError.message}`);
        }

        // 2. Attempt to delete from Supabase Auth (Optional/Cleanup)
        // We do this in a try-catch or check error to avoid blocking if user was never in Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(parentId);
        
        if (authError && !authError.message.includes('User not found')) {
            console.warn('Optional Auth deletion failed:', authError.message);
            // We don't throw here because the main record is already gone
        }

        return {
            success: true,
            message: 'Parent record successfully deleted.',
        };
    } catch (error: unknown) {
        console.error('Delete Parent Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
