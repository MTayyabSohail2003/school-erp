import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type StudentUpdateData = {
    roll_number: string;
    full_name: string;
    date_of_birth: string;
    class_id: string;
};

export function useUpdateStudent() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: StudentUpdateData }) => {
            const { error } = await supabase
                .from('students')
                .update({
                    roll_number: data.roll_number,
                    full_name: data.full_name,
                    date_of_birth: data.date_of_birth,
                    class_id: data.class_id,
                })
                .eq('id', id);

            if (error) throw new Error(error.message);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
}
