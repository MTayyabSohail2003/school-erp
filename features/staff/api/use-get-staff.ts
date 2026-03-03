import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Staff } from '../schemas/staff.schema';

export function useGetStaff() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    full_name,
                    phone_number,
                    created_at,
                    teacher_profiles (
                        qualification,
                        monthly_salary
                    )
                `)
                .eq('role', 'TEACHER')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            // Flatten the joined data to match the Staff schema
            return (data || []).map((user) => {
                const profile = Array.isArray(user.teacher_profiles)
                    ? user.teacher_profiles[0]
                    : user.teacher_profiles;

                return {
                    id: user.id,
                    user_id: user.id, // Keeping both for UI convenience
                    email: user.email,
                    full_name: user.full_name,
                    phone_number: user.phone_number,
                    created_at: user.created_at,
                    qualification: profile?.qualification || '',
                    monthly_salary: profile?.monthly_salary || 0,
                } as unknown as Staff;
            });
        },
    });
}
