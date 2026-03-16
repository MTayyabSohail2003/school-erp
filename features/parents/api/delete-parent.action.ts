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

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // 1. Delete from Supabase Auth
        // This automatically cascades to public.users because of the foreign key onDelete cascade
        // configured in the database schema. If it doesn't, we'd delete from users table first.
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(parentId);

        if (authError) {
            throw new Error(`Failed to delete parent: ${authError.message}`);
        }

        return {
            success: true,
            message: 'Parent account successfully deleted.',
        };
    } catch (error: unknown) {
        console.error('Delete Parent Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
