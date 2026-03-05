import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface TeacherSubject {
    id: string;
    teacher_id: string;
    subject_id: string;
    subject: {
        id: string;
        name: string;
        class: {
            id: string;
            name: string;
            section: string;
        };
    };
}

export const useGetTeacherSubjects = (teacherId: string) => {
    return useQuery({
        queryKey: ['teacher-subjects', teacherId],
        queryFn: async () => {
            if (!teacherId) return [];
            const supabase = createClient();
            const { data, error } = await supabase
                .from('teacher_subjects')
                .select(`
                    id,
                    teacher_id,
                    subject_id,
                    subject:subjects (
                        id,
                        name,
                        class:classes (
                            id,
                            name,
                            section
                        )
                    )
                `)
                .eq('teacher_id', teacherId);

            if (error) throw new Error(error.message);
            // Type casting to handle nested Supabase relations easily
            return data as unknown as TeacherSubject[];
        },
        enabled: !!teacherId,
    });
};

export const useAssignTeacherSubjects = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ teacherId, subjectIds }: { teacherId: string; subjectIds: string[] }) => {
            const supabase = createClient();

            // 1. Delete existing subjects for this teacher (clean slate)
            const { error: deleteError } = await supabase
                .from('teacher_subjects')
                .delete()
                .eq('teacher_id', teacherId);

            if (deleteError) throw new Error(deleteError.message);

            // 2. Insert new subjects if any were selected
            if (subjectIds.length > 0) {
                const inserts = subjectIds.map(subject_id => ({
                    teacher_id: teacherId,
                    subject_id
                }));

                const { error: insertError } = await supabase
                    .from('teacher_subjects')
                    .insert(inserts);

                if (insertError) throw new Error(insertError.message);
            }

            return true;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['teacher-subjects', variables.teacherId] });
        },
    });
};
