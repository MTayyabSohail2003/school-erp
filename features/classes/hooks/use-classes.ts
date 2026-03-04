import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi, type ClassRecord } from '../api/classes.api';

export const classKeys = {
    all: ['classes'] as const,
};

export function useClasses() {
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
