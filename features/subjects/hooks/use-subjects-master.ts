import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsMasterApi, type SubjectMaster } from '../api/subjects-master.api';

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
