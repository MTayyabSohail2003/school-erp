import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaffAction } from './create-staff.action';
import { StaffFormData } from '../schemas/staff.schema';
import { broadcastNotification } from '@/features/notifications/actions/notification-actions';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';
import { STAFF_KEY } from './use-get-staff';

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
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries({ queryKey: STAFF_KEY });
            // Notify all admins of new staff registration
            await broadcastNotification(['ADMIN'], NotificationTemplates.NEW_STAFF_REGISTERED(variables.full_name));
        },
    });
}
