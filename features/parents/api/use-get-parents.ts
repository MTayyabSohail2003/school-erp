import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type ParentUser = {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    students: {
        id: string;
        full_name: string;
        roll_number: string;
        classes: {
            name: string;
            section: string;
        };
    }[];
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
                    phone_number,
                    students (
                        id,
                        full_name,
                        roll_number,
                        classes (
                            name,
                            section
                        )
                    )
                `)
                .eq('role', 'PARENT')
                .order('full_name', { ascending: true });

            if (error) {
                throw new Error(error.message);
            }

            return data as unknown as ParentUser[];
        },
    });
}
