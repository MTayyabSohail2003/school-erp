import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/features/notifications/api/use-notifications';

const PAGE_SIZE = 20;

/** Fetches notifications in pages (newest first). */
export const useInfiniteNotifications = (pageSize: number = PAGE_SIZE) => {
    return useInfiniteQuery<Notification[], Error>({
        queryKey: ['notifications', 'infinite'],
        queryFn: async ({ pageParam }) => {
            const offset = typeof pageParam === 'number' ? pageParam : 0;
            const supabase = createClient();
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + pageSize - 1);
            if (error) throw new Error(error.message);
            return data as Notification[];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < pageSize) return undefined;
            return allPages.length * pageSize;
        },
        staleTime: 0,
    });
};
