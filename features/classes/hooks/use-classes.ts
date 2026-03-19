import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi, type ClassRecord } from '../api/classes.api';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { toast } from 'sonner';

export const classKeys = {
    all: ['classes'] as const,
};

export function useClasses() {
    useRealtimeInvalidate({ table: 'classes', queryKey: classKeys.all });
    return useQuery({
        queryKey: classKeys.all,
        queryFn: classesApi.getClasses,
    });
}

export function useCreateClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<ClassRecord, 'id'>) => classesApi.createClass(data),
        onMutate: async (newClass) => {
            await queryClient.cancelQueries({ queryKey: classKeys.all });
            const previousClasses = queryClient.getQueryData<ClassRecord[]>(classKeys.all);

            queryClient.setQueryData<ClassRecord[]>(classKeys.all, (old) => {
                const optimisticClass: ClassRecord = {
                    ...newClass,
                    id: crypto.randomUUID(), // stable temp id for optimistic update
                };
                return old ? [...old, optimisticClass].sort((a, b) => a.name.localeCompare(b.name)) : [optimisticClass];
            });

            return { previousClasses };
        },
        onError: (err, newClass, context) => {
            if (context?.previousClasses) {
                queryClient.setQueryData(classKeys.all, context.previousClasses);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: classKeys.all });
        },
    });
}

export function useDeleteClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => classesApi.deleteClass(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: classKeys.all });
        },
    });
}

export function useUpdateClass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<ClassRecord> }) =>
            classesApi.updateClass(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: classKeys.all });
            toast.success('Class updated successfully');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Failed to update class');
        },
    });
}
