import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { LoginCredentials } from '../schemas/auth.schema';

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
        onSuccess: () => {
            // Invalidate the auth profile query on success
            queryClient.invalidateQueries({ queryKey: ['authProfile'] });
        },
    });
}

export function useAuthProfile() {
    return useQuery({
        queryKey: ['authProfile'],
        queryFn: authApi.getProfile,
        retry: false, // Don't keep retrying if unauthorized
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            // Clear all queries on logout
            queryClient.clear();
        },
    });
}

export function useUploadAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, file }: { userId: string; file: File }) =>
            authApi.uploadAvatar(userId, file),
        onSuccess: () => {
            // Refresh the user's profile to get the new avatar_url
            queryClient.invalidateQueries({ queryKey: ['authProfile'] });
        },
    });
}
