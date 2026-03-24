import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { deleteNotificationAction, deleteAllNotificationsAction } from '../actions/delete-notifications.action';

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

// Delete a single notification
export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (notificationId: string) => {
            const result = await deleteNotificationAction(notificationId);
            if (result.error) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'infinite'] });
        },
    });
};

// Delete ALL notifications for the current user
export const useDeleteAllNotifications = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const result = await deleteAllNotificationsAction();
            if (result.error) throw new Error(result.error);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'infinite'] });
        },
    });
};

// Realtime subscription — pushes live updates into both flat and infinite query caches
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
                // Client-side filter — only process rows meant for this user
                if (incoming.recipient_id !== user.id) return;

                // Update flat query cache
                queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) =>
                    old ? [incoming, ...old] : [incoming]
                );

                // Update infinite query cache — prepend to first page
                queryClient.setQueryData<InfiniteData<Notification[]>>(
                    ['notifications', 'infinite'],
                    (old) => {
                        if (!old) return old;
                        const [first, ...rest] = old.pages;
                        return {
                            ...old,
                            pages: [[incoming, ...(first ?? [])], ...rest],
                        };
                    }
                );
            };

            const handleUpdate = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                const updated = payload.new as Notification;
                // Client-side filter
                if (updated.recipient_id !== user.id) return;

                // Update flat query cache
                queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) =>
                    old ? old.map((n) => (n.id === updated.id ? updated : n)) : old
                );

                // Update infinite query cache
                queryClient.setQueryData<InfiniteData<Notification[]>>(
                    ['notifications', 'infinite'],
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            pages: old.pages.map((page) =>
                                page.map((n) => (n.id === updated.id ? updated : n))
                            ),
                        };
                    }
                );
            };

            const handleDelete = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                const deletedRecord = payload.old as { id?: string };
                const deletedId = deletedRecord.id;
                
                if (!deletedId) return;

                // Update flat query cache
                queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) =>
                    old ? old.filter((n) => n.id !== deletedId) : old
                );

                // Update infinite query cache
                queryClient.setQueryData<InfiniteData<Notification[]>>(
                    ['notifications', 'infinite'],
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            pages: old.pages.map((page) =>
                                page.filter((n) => n.id !== deletedId)
                            ),
                        };
                    }
                );
            };

            // No server-side filter — we filter client-side by recipient_id.
            // This avoids Supabase Realtime's REPLICA IDENTITY requirement for filtered CDC.
            const channel = supabase
                .channel(`notifications:user:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                }, handleInsert)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                }, handleUpdate)
                .on('postgres_changes', {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications',
                }, handleDelete)
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
