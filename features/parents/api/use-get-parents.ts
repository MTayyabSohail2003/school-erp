import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type ParentUser = {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
};

export function useGetParents() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['parents'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    full_name,
                    phone_number
                `)
                .eq('role', 'PARENT')
                .order('full_name', { ascending: true });

            if (error) {
                throw new Error(error.message);
            }

            return data as ParentUser[];
        },
    });
}
