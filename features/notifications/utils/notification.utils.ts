import { createClient } from '@/lib/supabase/client';
import { type NotificationType } from '@/features/notifications/api/use-notifications';

interface SendNotificationOptions {
    recipientId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
}

/**
 * Client-side helper to insert a notification.
 * Used in mutation onSuccess callbacks.
 */
export async function sendNotification({
    recipientId,
    title,
    message,
    type = 'INFO',
    link,
}: SendNotificationOptions): Promise<void> {
    const supabase = createClient();
    await supabase.from('notifications').insert({
        recipient_id: recipientId,
        title,
        message,
        type,
        link: link ?? null,
        is_read: false,
    });
}

/**
 * Fetch all admin user IDs (client-side).
 * Used to broadcast admin notifications.
 */
export async function getAdminUserIds(): Promise<string[]> {
    const supabase = createClient();
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'ADMIN');
    return (data ?? []).map((u: { id: string }) => u.id);
}

/**
 * Send a notification to every admin in the system.
 */
export async function notifyAllAdmins(opts: Omit<SendNotificationOptions, 'recipientId'>): Promise<void> {
    const adminIds = await getAdminUserIds();
    const supabase = createClient();
    if (adminIds.length === 0) return;

    await supabase.from('notifications').insert(
        adminIds.map((id) => ({
            recipient_id: id,
            title: opts.title,
            message: opts.message,
            type: opts.type ?? 'INFO',
            link: opts.link ?? null,
            is_read: false,
        })),
    );
}
