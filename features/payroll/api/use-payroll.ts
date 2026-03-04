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
        mutationFn: ({ profileId, salary }: { profileId: string; salary: number }) =>
            payrollApi.updateSalary(profileId, salary),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll'] });
        },
    });
};
