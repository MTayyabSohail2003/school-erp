import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaffAction } from './create-staff.action';
import { StaffFormData } from '../schemas/staff.schema';

export function useCreateStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: StaffFormData) => {
            const result = await createStaffAction(data);
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
