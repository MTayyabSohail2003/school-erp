import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const promoteStudents = async (fromClassId: string, toClassId: string): Promise<number> => {
    const supabase = createClient();

    // Get all students in the source class
    const { data: students, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', fromClassId);

    if (fetchError) throw new Error(fetchError.message);
    if (!students || students.length === 0) throw new Error('No students found in the selected class.');

    const ids = students.map(s => s.id);

    const { error } = await supabase
        .from('students')
        .update({ class_id: toClassId })
        .in('id', ids);

    if (error) throw new Error(error.message);
    return ids.length;
};

export const usePromoteStudents = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ fromClassId, toClassId }: { fromClassId: string; toClassId: string }) =>
            promoteStudents(fromClassId, toClassId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students', 'byClass'] });
        },
    });
};
