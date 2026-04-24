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
        return (data || []).map((user: any) => {
            // Note: Since it's a 1-to-1 relationship, teacher_profiles may come back as an object directly, not an array.
            const profile = Array.isArray(user.teacher_profiles)
                ? user.teacher_profiles[0]
                : user.teacher_profiles;

            return {
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number,
                profile_id: profile?.id,
                qualification: profile?.qualification || 'N/A',
                monthly_salary: profile?.monthly_salary || 0,
            };
        });
    },

    updateSalary: async (profileId: string, salary: number, monthYear?: string, teacherId?: string) => {
        if (!profileId) throw new Error("No profile found for this teacher. Please create a staff profile first.");
        const supabase = createClient();
        
        // 1. Update the global base salary for future/fallback
        const { error: profileError } = await supabase
            .from('teacher_profiles')
            .update({ monthly_salary: salary })
            .eq('id', profileId);

        if (profileError) throw new Error(profileError.message);

        // 2. 🚀 INDUSTRY LEVEL: Snapshot for the specifically selected month
        // This ensures the selected month and future months see this salary, but past months keep their ledger records
        if (monthYear && teacherId) {
            const { error: ledgerError } = await supabase
                .from('staff_payroll_ledger')
                .upsert({
                    teacher_id: teacherId,
                    month_year: monthYear,
                    base_salary: salary,
                    net_paid: 0, // Satisfaction of NOT NULL constraint
                    status: 'PENDING', // Default to pending if record is new
                }, { 
                    onConflict: 'teacher_id, month_year' 
                });

            if (ledgerError) throw new Error(ledgerError.message);
        }
    }
};
