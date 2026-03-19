import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef } from 'react';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';

export type NoticeAudience = 'TEACHER' | 'PARENT' | 'ALL';

export type Notice = {
    id: string;
    title: string;
    body: string;
    posted_by: string;
    target_audience: NoticeAudience;
    created_at: string;
};

export const NOTICES_KEY = ['notices'] as const;

const fetchNotices = async (audience?: NoticeAudience, date?: string): Promise<Notice[]> => {
    const supabase = createClient();
    let query = supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (audience) {
        query = query.in('target_audience', [audience, 'ALL']);
    }

    if (date) {
        // Filter by date (YYYY-MM-DD)
        const start = `${date}T00:00:00Z`;
        const end = `${date}T23:59:59Z`;
        query = query.gte('created_at', start).lte('created_at', end);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Notice[];
};

// All notices (admin view)
export const useNotices = (date?: string) =>
    useQuery({ 
        queryKey: date ? [...NOTICES_KEY, { date }] : NOTICES_KEY, 
        queryFn: () => fetchNotices(undefined, date) 
    });

// Teacher-only notices
export const useTeacherNotices = (date?: string) =>
    useQuery({
        queryKey: date ? [...NOTICES_KEY, 'TEACHER', { date }] : [...NOTICES_KEY, 'TEACHER'],
        queryFn: () => fetchNotices('TEACHER', date),
    });

// Parent-only notices
export const useParentNotices = (date?: string) =>
    useQuery({
        queryKey: date ? [...NOTICES_KEY, 'PARENT', { date }] : [...NOTICES_KEY, 'PARENT'],
        queryFn: () => fetchNotices('PARENT', date),
    });

/**
 * Hook to fetch notices based on the current user's role context.
 * Used for the global announcement banner.
 */
export const useContextNotices = () => {
    const { data: profile } = useAuthProfile();
    const role = profile?.role;

    return useQuery({
        queryKey: role ? [...NOTICES_KEY, 'CONTEXT', role] : [...NOTICES_KEY, 'CONTEXT'],
        queryFn: () => {
            const audience = role === 'TEACHER' ? 'TEACHER' : role === 'PARENT' ? 'PARENT' : undefined;
            return fetchNotices(audience);
        },
        enabled: !!profile,
    });
};

// Post a new notice (calls server action for notification broadcast)
export const usePostNotice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            title,
            body,
            target_audience,
        }: {
            title: string;
            body: string;
            target_audience: NoticeAudience;
        }) => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            const { error } = await supabase
                .from('notices')
                .insert({ title, body, posted_by: user.id, target_audience });
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
        },
    });
};

// Delete a notice
export const useDeleteNotice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = createClient();
            const { error } = await supabase.from('notices').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
        },
    });
};

// Bulk delete notices
export const useBulkDeleteNotices = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: string[]) => {
            const supabase = createClient();
            const { error } = await supabase.from('notices').delete().in('id', ids);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
        },
    });
};

// Realtime subscription — invalidates all notice queries on any change
export const useNoticesRealtime = () => {
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('notices-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, () => {
                queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notices' }, () => {
                queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notices' }, () => {
                queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};
