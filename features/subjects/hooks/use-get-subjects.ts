import { useQuery } from '@tanstack/react-query';
import { subjectsApi, type Subject } from '../api/subjects.api';

export function useGetSubjects() {
    return useQuery<Subject[]>({
        queryKey: ['subjects'],
        queryFn: subjectsApi.getSubjects,
    });
}
