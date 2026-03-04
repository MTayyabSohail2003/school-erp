import { useQuery } from '@tanstack/react-query';
import { reportCardApi } from './report-card.api';

export const useGetReportCard = (studentId: string, examId: string) =>
    useQuery({
        queryKey: ['report-card', studentId, examId] as const,
        queryFn: () => reportCardApi.getStudentReportCard(studentId, examId),
        enabled: Boolean(studentId && examId),
    });
