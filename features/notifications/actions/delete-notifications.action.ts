'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function deleteNotificationAction(notificationId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Not authenticated' };
        }

        // Get the profile to verify ADMIN role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'ADMIN') {
            return { error: 'Unauthorized: Admins only' };
        }

        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('Error deleting notification:', error);
            return { error: 'Failed to delete notification' };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Unexpected error deleting notification:', err);
        return { error: err.message || 'An unexpected error occurred' };
    }
}

export async function deleteAllNotificationsAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Not authenticated' };
        }

        // Get the profile to verify ADMIN role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'ADMIN') {
            return { error: 'Unauthorized: Admins only' };
        }

        // The user requested to delete ALL notifications from the DB dynamically.
        // Bypassing RLS with admin client to delete all records.
        // We use neq('id', '00000000-0000-0000-0000-000000000000') as a trick to match all records,
        // because Supabase requires at least one filter on deletes.
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('notifications')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.error('Error deleting all notifications:', error);
            return { error: 'Failed to clear all notifications' };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Unexpected error deleting all notifications:', err);
        return { error: err.message || 'An unexpected error occurred' };
    }
}
