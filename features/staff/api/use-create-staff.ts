import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaffAction } from './create-staff.action';
import { StaffFormData } from '../schemas/staff.schema';
import { notifyAllAdmins } from '@/features/notifications/utils/notification.utils';
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
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: STAFF_KEY });
            // Notify all admins of new staff registration
            await notifyAllAdmins({
                title: 'New Staff Registered',
                message: 'A new teacher account has been created and is ready for class assignment.',
                type: 'SUCCESS',
                link: '/dashboard/staff',
            });
        },
    });
}
