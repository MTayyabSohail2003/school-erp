'use client';

import { useNotificationToast } from '@/features/notifications/hooks/use-notification-toast';

/**
 * Mount this component once in the dashboard layout.
 * It opens a Supabase Realtime channel and fires sonner toasts
 * for any incoming notification addressed to the current user.
 */
export function NotificationToastListener() {
    useNotificationToast();
    return null;
}
