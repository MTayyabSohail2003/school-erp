import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteStaffAction } from './delete-staff.action';

export function useDeleteStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const result = await deleteStaffAction(userId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}
