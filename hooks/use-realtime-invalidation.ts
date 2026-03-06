'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * A generic hook to listen to changes on a specific Supabase table
 * and automatically invalidate the provided React Query keys.
 *
 * @param tableName The exact name of the table in your database
 * @param queryKeys Array of TanStack query keys to invalidate when data changes
 * @param filter Optional Postgres filter string e.g., 'id=eq.123'
 */
export function useRealtimeInvalidation(
    tableName: string,
    queryKeys: unknown[],
    filter?: string
) {
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

    useEffect(() => {
        const supabase = createClient();

        let channelName = `public:${tableName}`;
        if (filter) {
            channelName += `:${filter}`;
        }

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: tableName,
                    filter: filter,
                },
                () => {
                    // When any change happens on the table, invalidate the query
                    queryKeys.forEach(key => {
                        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
                    });
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [queryClient, tableName, queryKeys, filter]);
}
