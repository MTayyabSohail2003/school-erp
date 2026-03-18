import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsMasterApi } from '../api/subjects-master.api';

export function useBulkCreateMasterSubjects() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (subjects: { name: string; code: string | null }[]) => 
            subjectsMasterApi.bulkCreateSubjects(subjects),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects-master'] });
        },
    });
}
