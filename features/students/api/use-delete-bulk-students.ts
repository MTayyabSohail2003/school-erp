import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useDeleteBulkStudents() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            const { error } = await supabase.from('students').delete().in('id', ids);

            if (error) {
                throw new Error(error.message);
            }
            return ids;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
    });
}
