import { createAdminClient } from '@/lib/supabase/admin';
import { type NotificationTemplate } from '../utils/notification-templates';
import { Role } from '@/constants/globals';

/**
 * SERVER-SIDE ONLY
 * Broadcasts a notification to all users of a specific role using administrative privileges.
 * This is the preferred way to trigger global alerts from server actions.
 */
export async function broadcastNotification(roles: Role[], template: NotificationTemplate) {
    try {
        const supabase = createAdminClient();

        // 1. Fetch all user IDs for the given roles
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .in('role', roles);

        if (fetchError) {
            console.error('Error fetching users for broadcast:', fetchError);
            return;
        }

        if (!users || users.length === 0) return;

        // 2. Prepare bulk insert
        const notifications = users.map((user) => ({
            recipient_id: user.id,
            title: template.title,
            message: template.message,
            type: template.type,
            link: template.link || null,
            is_read: false,
        }));

        // 3. Insert in batches of 100 to be safe (Supabase handles large inserts but batching is better)
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(batch);
            
            if (insertError) {
                console.error(`Error inserting notification batch ${i/batchSize}:`, insertError);
            }
        }

    } catch (e) {
        console.error('Unexpected error in broadcastNotification:', e);
    }
}

/**
 * SERVER-SIDE ONLY
 * Sends a notification to a specific user.
 */
export async function sendDirectNotification(recipientId: string, template: NotificationTemplate) {
    try {
        const supabase = createAdminClient();
        const { error } = await supabase.from('notifications').insert({
            recipient_id: recipientId,
            title: template.title,
            message: template.message,
            type: template.type,
            link: template.link || null,
            is_read: false,
        });
        if (error) console.error('Error sending direct notification:', error);
    } catch (e) {
        console.error('Unexpected error in sendDirectNotification:', e);
    }
}
