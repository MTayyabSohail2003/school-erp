import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStaffAction } from './update-staff.action';
import { StaffUpdateData } from '../schemas/staff.schema';

export function useUpdateStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: StaffUpdateData }) => {
            const result = await updateStaffAction(id, data);
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
