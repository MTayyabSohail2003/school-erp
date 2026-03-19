import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../api/students.api';
import { type StudentFormData } from '../schemas/student.schema';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { broadcastNotification } from '@/features/notifications/actions/notification-actions';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';

export const studentKeys = {
    all: ['students'] as const,
};

export function useStudents(options?: { parentId?: string; classIds?: string[] }) {
    useRealtimeInvalidate({ table: 'students', queryKey: studentKeys.all });
    return useQuery({
        queryKey: options ? [...studentKeys.all, options] : studentKeys.all,
        queryFn: () => studentsApi.getStudents(options),
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StudentFormData) => studentsApi.createStudent(data),
        onSuccess: async (data, variables) => {
            // Notify admins
            await broadcastNotification(['ADMIN'], NotificationTemplates.NEW_STUDENT_REGISTERED(variables.full_name));
        },
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
