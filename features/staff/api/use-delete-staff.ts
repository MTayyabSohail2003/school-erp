import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteStaffAction } from './delete-staff.action';
import { notifyAllAdmins } from '@/features/notifications/utils/notification.utils';
import { STAFF_KEY } from './use-get-staff';

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
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: STAFF_KEY });
            // Notify all admins of staff removal
            await notifyAllAdmins({
                title: 'Staff Account Removed',
                message: 'A teacher account has been permanently removed from the system.',
                type: 'WARNING',
                link: '/dashboard/staff',
            });
        },
    });
}
