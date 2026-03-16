import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../api/students.api';
import { type StudentFormData } from '../schemas/student.schema';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export const studentKeys = {
    all: ['students'] as const,
};

export function useStudents(parentId?: string) {
    useRealtimeInvalidate({ table: 'students', queryKey: studentKeys.all });
    return useQuery({
        queryKey: parentId ? [...studentKeys.all, parentId] : studentKeys.all,
        queryFn: () => studentsApi.getStudents(parentId),
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StudentFormData) => studentsApi.createStudent(data),
        onMutate: async (newStudent) => {
            // Optimistic Update
            await queryClient.cancelQueries({ queryKey: studentKeys.all });
            const previousStudents = queryClient.getQueryData(studentKeys.all);

            const optimisticStudent = {
                ...newStudent,
                id: Math.random().toString(), // fake id for UI
                created_at: new Date().toISOString(),
                classes: { name: 'Loading...', section: '' }
            };
            queryClient.setQueryData<typeof optimisticStudent[]>(studentKeys.all, (old) => {
                return old ? [optimisticStudent, ...old] : [optimisticStudent];
            });

            return { previousStudents };
        },
        onError: (err, newStudent, context) => {
            // Rollback on error
            if (context?.previousStudents) {
                queryClient.setQueryData(studentKeys.all, context.previousStudents);
            }
        },
        onSettled: () => {
            // Always refetch to ensure real IDs and relationships are loaded
            queryClient.invalidateQueries({ queryKey: studentKeys.all });
        },
    });
}
