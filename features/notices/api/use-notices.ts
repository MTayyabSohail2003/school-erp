import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef } from 'react';

export type Notice = {
    id: string;
    title: string;
    body: string;
    posted_by: string;
    created_at: string;
};

const NOTICES_KEY = ['notices'] as const;

// Fetch the latest 20 notices
export const useNotices = () => {
    return useQuery({
        queryKey: NOTICES_KEY,
        queryFn: async (): Promise<Notice[]> => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw new Error(error.message);
            return data as Notice[];
        },
    });
};

// Post a new notice
export const usePostNotice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ title, body }: { title: string; body: string }) => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            const { error } = await supabase.from('notices').insert({ title, body, posted_by: user.id });
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

// Realtime subscription — invalidates the query on INSERT, UPDATE, DELETE
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
