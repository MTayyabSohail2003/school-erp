import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsMasterApi, type SubjectMaster } from '../api/subjects-master.api';
import { subjectsAssignmentApi } from '../api/subjects-assignment.api';

export function useSubjectsMaster() {
    return useQuery<SubjectMaster[]>({
        queryKey: ['subjects-master'],
        queryFn: subjectsMasterApi.getSubjects,
    });
}

export function useCreateMasterSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, code }: { name: string; code: string | null }) => 
            subjectsMasterApi.createSubject(name, code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects-master'] });
        },
    });
}

export function useDeleteMasterSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => subjectsMasterApi.deleteSubject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects-master'] });
        },
    });
}

export function useUpdateMasterSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name, code }: { id: string; name: string; code: string | null }) => {
            const updated = await subjectsMasterApi.updateSubject(id, name, code);
            // CASCADING UPDATE: Ensure all class assignments are also updated to match
            await subjectsAssignmentApi.updateRelatedAssignments(id, name, code);
            return updated;
        },
        onSuccess: () => {
            // Invalidate everything to ensure 100% dynamic consistency across UI
            queryClient.invalidateQueries({ queryKey: ['subjects-master'] });
            queryClient.invalidateQueries({ queryKey: ['subjects', 'all-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['subjects', 'class'] });
        },
    });
}
