'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { type Notification, NOTIFICATIONS_KEY } from '@/features/notifications/api/use-notifications';

const TYPE_ICON: Record<string, string> = {
    INFO: 'ℹ️',
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '🚨',
};

/**
 * Listens for new incoming notifications via Supabase Realtime and
 * fires a sonner toast. Mount once in the dashboard layout.
 */
export function useNotificationToast() {
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
    // Track already-seen IDs so we don't toast stale data on initial load
    const seenIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const supabase = createClient();

        const bootstrap = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Pre-seed seen IDs with current cached notifications
            const cached = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_KEY) ?? [];
            cached.forEach((n) => seenIdsRef.current.add(n.id));

            const handleInsert = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                const notification = payload.new as Notification;
                if (seenIdsRef.current.has(notification.id)) return;
                seenIdsRef.current.add(notification.id);

                const icon = TYPE_ICON[notification.type] ?? TYPE_ICON.INFO;
                toast(`${icon} ${notification.title}`, {
                    description: notification.message,
                    duration: 5000,
                    action: notification.link
                        ? { label: 'View', onClick: () => window.location.assign(notification.link!) }
                        : undefined,
                });
            };

            const channel = supabase
                .channel(`notification-toast:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${user.id}`,
                }, handleInsert)
                .subscribe();

            channelRef.current = channel;
        };

        bootstrap();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [queryClient]);
}
