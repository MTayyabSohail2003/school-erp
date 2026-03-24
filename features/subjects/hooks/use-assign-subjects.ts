import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsAssignmentApi } from '../api/subjects-assignment.api';
import { type SubjectMaster } from '../api/subjects-master.api';

export function useAssignSubjects() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ classId, masterIds, masterSubjects }: { classId: string; masterIds: string[]; masterSubjects: SubjectMaster[] }) => 
            subjectsAssignmentApi.bulkAssignSubjects(classId, masterIds, masterSubjects),
        onSuccess: (_, { classId }) => {
            queryClient.invalidateQueries({ queryKey: ['subjects', 'class', classId] });
            queryClient.invalidateQueries({ queryKey: ['subjects', 'all-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['subjects'] }); // fallback
        },
    });
}
