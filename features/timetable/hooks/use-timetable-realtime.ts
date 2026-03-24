'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to enable real-time updates for periods and timetable data.
 * When a change is detected in the Supabase 'periods' or 'timetable' tables,
 * the corresponding TanStack Query cache is invalidated.
 */
export function useTimetableRealtime() {
    const queryClient = useQueryClient();
    const supabase = useRef(createClient());

    useEffect(() => {
        const client = supabase.current;

        const channel = client
            .channel('timetable-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'periods' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['periods'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'timetable' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['timetable'] });
                    // Also invalidate teacher dashboard stats since they depend on timetable assignments
                    queryClient.invalidateQueries({ queryKey: ['teacher-chart-stats'] });
                }
            )
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, [queryClient]);
}
