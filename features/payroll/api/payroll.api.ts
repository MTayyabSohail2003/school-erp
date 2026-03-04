import { createClient } from '@/lib/supabase/client';


export const payrollApi = {
    getPayroll: async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, 
                full_name, 
                email, 
                phone_number,
                teacher_profiles(id, qualification, monthly_salary)
            `)
            .eq('role', 'TEACHER')
            .order('full_name', { ascending: true });

        if (error) throw new Error(error.message);

        // Transform for easier consumption
        return (data || []).map((user: any) => ({
            user_id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            profile_id: user.teacher_profiles?.[0]?.id,
            qualification: user.teacher_profiles?.[0]?.qualification || 'N/A',
            monthly_salary: user.teacher_profiles?.[0]?.monthly_salary || 0,
        }));
    },

    updateSalary: async (profileId: string, salary: number) => {
        if (!profileId) throw new Error("No profile found for this teacher. Please create a staff profile first.");
        const supabase = createClient();
        const { error } = await supabase
            .from('teacher_profiles')
            .update({ monthly_salary: salary })
            .eq('id', profileId);

        if (error) throw new Error(error.message);
    }
};
