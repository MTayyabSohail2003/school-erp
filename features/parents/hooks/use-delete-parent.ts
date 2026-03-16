import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteParentAction } from '../api/delete-parent.action';
import { toast } from 'sonner';

export function useDeleteParent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (parentId: string) => {
            const result = await deleteParentAction(parentId);
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['parents'] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
}
