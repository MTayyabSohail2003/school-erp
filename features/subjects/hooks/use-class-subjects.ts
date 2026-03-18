import { useQuery } from '@tanstack/react-query';
import { subjectsAssignmentApi } from '../api/subjects-assignment.api';
import { type Subject } from '../api/subjects.api';

export function useClassSubjects(classId: string) {
    return useQuery<Subject[]>({
        queryKey: ['subjects', classId],
        queryFn: () => subjectsAssignmentApi.getClassSubjects(classId),
        enabled: !!classId,
    });
}
