'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function submitForceDeleteStaff(staffId: string, password: string) {
    if (!staffId || !password) {
        return { success: false, error: 'Staff ID and Password are required.' };
    }

    try {
        const supabase = await createClient();

        // 1. Get current admin's email
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user?.email) {
            return { success: false, error: 'Unauthorized: Could not identify current user.' };
        }

        // 2. Verify password
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password,
        });

        if (authError) {
            return { success: false, error: 'Incorrect password. Force delete aborted.' };
        }

        // 3. Execute destructive actions using Service Role Admin Client
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // A. Delete timetable periods assigned to this teacher
        await supabaseAdmin.from('timetable').delete().eq('teacher_id', staffId);

        // B. Delete teacher subjects mapping
        await supabaseAdmin.from('teacher_subjects').delete().eq('teacher_id', staffId);

        // C. Remove as Class In-charge from any classes
        await supabaseAdmin.from('classes').update({ class_teacher_id: null }).eq('class_teacher_id', staffId);

        // D. Delete from public.users table (cascades or handles specific app logic)
        await supabaseAdmin.from('users').delete().eq('id', staffId);

        // E. Delete from Supabase Auth completely
        const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(staffId);
        
        if (deleteAuthErr) {
            console.error('Auth user delete error:', deleteAuthErr);
            // Ignore auth deletion fail if user is already gone, but log it.
        }

        return { success: true };
    } catch (err: any) {
        console.error('Force delete staff error:', err);
        return { success: false, error: err.message || 'An unexpected error occurred during force deletion.' };
    }
}
