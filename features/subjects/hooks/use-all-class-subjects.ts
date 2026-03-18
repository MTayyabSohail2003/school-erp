import { useQuery } from '@tanstack/react-query';
import { subjectsAssignmentApi } from '../api/subjects-assignment.api';

export function useAllClassSubjects() {
    return useQuery({
        queryKey: ['subjects', 'all-assignments'],
        queryFn: () => subjectsAssignmentApi.getAllAssignments()
    });
}
