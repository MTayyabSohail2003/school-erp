import { useQuery } from '@tanstack/react-query';
import { reportCardApi } from './report-card.api';

export const reportCardKeys = {
    all: ['report-card'] as const,
    card: (studentId: string, termId: string) =>
        [...reportCardKeys.all, studentId, termId] as const,
};

export function useGetReportCard(studentId: string, termId: string) {
    return useQuery({
        queryKey: reportCardKeys.card(studentId, termId),
        queryFn: () => reportCardApi.getStudentReportCard(studentId, termId),
        enabled: !!studentId && !!termId,
    });
}
