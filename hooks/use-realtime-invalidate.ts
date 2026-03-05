'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeInvalidateOptions {
    /** Supabase table to listen to */
    table: string;
    /** TanStack Query key to invalidate on change */
    queryKey: readonly unknown[];
    /** Which events to listen for. Defaults to all ('*'). */
    events?: RealtimeEvent[];
    /** Optional filter string, e.g. 'recipient_id=eq.some-uuid' */
    filter?: string;
}

/**
 * Generic Supabase Realtime hook.
 * Opens a channel and invalidates the given TanStack Query key
 * whenever a Postgres change fires on the target table.
 * Cleans up the channel on unmount.
 */
export function useRealtimeInvalidate({
    table,
    queryKey,
    events = ['*'],
    filter,
}: UseRealtimeInvalidateOptions) {
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const channelName = `realtime:${table}:${queryKey.join('-')}`;
        const channel = supabase.channel(channelName);

        const eventList = events.includes('*')
            ? (['INSERT', 'UPDATE', 'DELETE'] as const)
            : (events.filter((e) => e !== '*') as ('INSERT' | 'UPDATE' | 'DELETE')[]);

        const handler = (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            queryClient.invalidateQueries({ queryKey: queryKey as unknown[] });
        };

        eventList.forEach((event) => {
            channel.on('postgres_changes', {
                event,
                schema: 'public',
                table,
                ...(filter ? { filter } : {}),
            }, handler);
        });

        channel.subscribe();
        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, filter]);
}
