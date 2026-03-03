import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsApi } from './exams.api';
import { type SubjectFormData } from '../schemas/subject.schema';

const SUBJECTS_KEY = (classId: string) => ['subjects', classId] as const;

export const useGetSubjects = (classId: string) =>
    useQuery({
        queryKey: SUBJECTS_KEY(classId),
        queryFn: () => examsApi.getSubjectsByClass(classId),
        enabled: Boolean(classId),
    });

export const useCreateSubject = (classId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SubjectFormData) => examsApi.createSubject(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY(classId) }),
    });
};

export const useDeleteSubject = (classId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => examsApi.deleteSubject(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY(classId) }),
    });
};
