'use client';

import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../api/finance.api';

export const feeKeys = {
    all: ['finance', 'fees'] as const,
    structures: () => [...feeKeys.all, 'structures'] as const,
};

export function useFeeStructures() {
    return useQuery({
        queryKey: feeKeys.structures(),
        queryFn: () => financeApi.getFeeStructures(),
    });
}
