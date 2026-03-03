import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PromoteStudentsData } from '../schemas/student.schema';

export function usePromoteStudents() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (data: PromoteStudentsData) => {
            const { error, count } = await supabase
                .from('students')
                .update({ class_id: data.destination_class_id })
                .eq('class_id', data.source_class_id);

            if (error) throw error;
            return count; // Supabase doesn't easily return count on update without specific config, but we can just assume success if no error.
        },
        onSuccess: () => {
            // Invalidate all queries related to students and classes
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
    });
}
