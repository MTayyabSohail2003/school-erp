import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export type Notification = {
    id: string;
    recipient_id: string;
    title: string;
    message: string;
    type: NotificationType;
    link: string | null;
    is_read: boolean;
    created_at: string;
};

export const NOTIFICATIONS_KEY = ['notifications'] as const;

// Fetch all notifications for the logged-in user
export const useNotifications = () => {
    return useQuery({
        queryKey: NOTIFICATIONS_KEY,
        queryFn: async (): Promise<Notification[]> => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw new Error(error.message);
            return data as Notification[];
        },
    });
};

// Mark a single notification as read
export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (notificationId: string) => {
            const supabase = createClient();
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        },
    });
};

// Mark ALL notifications as read
export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const supabase = createClient();
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        },
    });
};

// Realtime subscription — pushes live updates into the cache for the current user
export const useNotificationsRealtime = () => {
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const bootstrap = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const handleInsert = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                const incoming = payload.new as Notification;
                queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) => {
                    if (!old) return [incoming];
                    return [incoming, ...old];
                });
            };

            const handleUpdate = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                const updated = payload.new as Notification;
                queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) => {
                    if (!old) return old;
                    return old.map((n) => (n.id === updated.id ? updated : n));
                });
            };

            const channel = supabase
                .channel(`notifications:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${user.id}`,
                }, handleInsert)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${user.id}`,
                }, handleUpdate)
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
};
