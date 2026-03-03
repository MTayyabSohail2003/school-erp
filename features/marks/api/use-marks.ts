import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marksApi } from './marks.api';
import { type MarkEntry } from '../schemas/mark.schema';

const MARKS_KEY = (examId: string, classId: string) => ['marks', examId, classId] as const;

export const useGetMarks = (examId: string, classId: string) =>
    useQuery({
        queryKey: MARKS_KEY(examId, classId),
        queryFn: () => marksApi.getMarksByExamAndClass(examId, classId),
        enabled: Boolean(examId && classId),
    });

export const useUpsertMarks = (examId: string, classId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (marks: MarkEntry[]) => marksApi.upsertMarks(marks),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: MARKS_KEY(examId, classId) }),
    });
};
