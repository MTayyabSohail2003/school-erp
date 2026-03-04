import { useQuery } from '@tanstack/react-query';
import { periodsApi, type Period } from '../api/periods.api';

export function useGetPeriods() {
    return useQuery<Period[]>({
        queryKey: ['periods'],
        queryFn: periodsApi.getPeriods,
    });
}
