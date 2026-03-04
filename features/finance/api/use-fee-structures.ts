import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from './finance.api';
import { type FeeStructureFormValues } from '../schemas/fee-structure.schema';

export const useGetFeeStructures = () =>
    useQuery({
        queryKey: ['fee-structures'],
        queryFn: financeApi.getFeeStructures,
    });

export const useUpsertFeeStructure = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: FeeStructureFormValues) => financeApi.upsertFeeStructure(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
        },
    });
};
