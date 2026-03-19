import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsApi } from './exams.api';
import { type ExamFormData } from '../schemas/exam.schema';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { broadcastNotification } from '@/features/notifications/actions/notification-actions';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';

const EXAMS_KEY = ['exams'] as const;

export const useGetExams = () => {
    useRealtimeInvalidate({ table: 'exams', queryKey: EXAMS_KEY });
    return useQuery({ queryKey: EXAMS_KEY, queryFn: examsApi.getExams });
};

export const useCreateExam = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ExamFormData) => examsApi.createExam(data),
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
            // Broadcast to all parents about the new exam
            await broadcastNotification(['PARENT'], NotificationTemplates.EXAM_SCHEDULED(variables.title));
        },
    });
};

export const useDeleteExam = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => examsApi.deleteExam(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAMS_KEY }),
    });
};
