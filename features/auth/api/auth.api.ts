import { createClient } from '@/lib/supabase/client';
import { LoginCredentials } from '../schemas/auth.schema';

export const authApi = {
    /**
     * Pure function to authenticate a user using Supabase auth.
     */
    login: async (credentials: LoginCredentials) => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    },

    /**
     * Pure function to fetch the current session's custom user profile (Role, etc).
     */
    getProfile: async () => {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) throw new Error('Not authenticated');

        const { data: profile, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (dbError) throw new Error(dbError.message);

        return profile;
    },

    /**
     * Sign out the active user.
     */
    logout: async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    },

    /**
     * Upload an avatar image and link it to the user profile
     */
    uploadAvatar: async (userId: string, file: File): Promise<string> => {
        const supabase = createClient();

        // 1. Upload to Supabase Storage 'avatars' bucket
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 2. Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Update the users table with the new avatar_url
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: publicUrl })
            .eq('id', userId);

        if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
        }

        return publicUrl;
    }
};
