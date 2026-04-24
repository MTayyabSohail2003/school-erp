import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from './payroll.api';

export const useGetPayroll = () =>
    useQuery({
        queryKey: ['payroll'],
        queryFn: payrollApi.getPayroll,
    });

export const useUpdateSalary = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ profileId, salary, monthYear, teacherId }: { profileId: string; salary: number; monthYear?: string; teacherId?: string }) =>
            payrollApi.updateSalary(profileId, salary, monthYear, teacherId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll'] });
            queryClient.invalidateQueries({ queryKey: ['payroll-dashboard'] });
        },
    });
};
