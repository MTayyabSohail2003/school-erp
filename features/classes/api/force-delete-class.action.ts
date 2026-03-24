'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function submitForceDeleteClass(classId: string, password: string) {
    if (!classId || !password) {
        return { success: false, error: 'Class ID and Password are required.' };
    }

    try {
        const supabase = await createClient();

        // 1. Get current admin's email
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user?.email) {
            return { success: false, error: 'Unauthorized: Could not identify current user.' };
        }

        // 2. Verify password by attempting to sign in
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password,
        });

        if (authError) {
            return { success: false, error: 'Incorrect password. Force delete aborted.' };
        }

        // 3. Password is correct. Execute destructive actions using the Service Role Admin Client.
        // We use the admin client to bypass any RLS protections and force cascade the deletion.
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // A. Delete timetable entries for this class
        const { error: timetableErr } = await supabaseAdmin
            .from('timetable')
            .delete()
            .eq('class_id', classId);
            
        if (timetableErr) throw new Error(`Failed to clean timetable: ${timetableErr.message}`);

        // B. Delete students currently enrolled in this class
        const { error: studentsErr } = await supabaseAdmin
            .from('students')
            .delete()
            .eq('class_id', classId);

        if (studentsErr) throw new Error(`Failed to clean students: ${studentsErr.message}`);

        // C. Delete the class itself
        const { error: classErr } = await supabaseAdmin
            .from('classes')
            .delete()
            .eq('id', classId);

        if (classErr) throw new Error(`Failed to delete class: ${classErr.message}`);

        return { success: true };
    } catch (err: any) {
        console.error('Force delete class error:', err);
        return { success: false, error: err.message || 'An unexpected error occurred during force deletion.' };
    }
}
