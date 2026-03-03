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
    }
};
