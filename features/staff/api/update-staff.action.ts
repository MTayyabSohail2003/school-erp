'use server';

import { createClient } from '@supabase/supabase-js';
import { StaffUpdateData, staffUpdateSchema } from '../schemas/staff.schema';

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function updateStaffAction(userId: string, data: StaffUpdateData) {
    try {
        if (!supabaseAdminKey) {
            return {
                success: false,
                error: 'Server Misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY'
            };
        }

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const parsed = staffUpdateSchema.parse(data);

        // 1. Update public.users table
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({
                full_name: parsed.full_name,
                phone_number: parsed.phone_number,
                status: parsed.status,
            })
            .eq('id', userId);

        if (userError) throw new Error(`User Update Error: ${userError.message}`);

        // 2. Update Auth metadata in case we rely on it elsewhere
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                full_name: parsed.full_name,
            }
        });

        if (authError) throw new Error(`Auth Update Error: ${authError.message}`);

        // 3. Update public.teacher_profiles
        const { error: profileError } = await supabaseAdmin
            .from('teacher_profiles')
            .update({
                qualification: parsed.qualification,
                monthly_salary: parsed.monthly_salary,
                resume_url: parsed.resume_url,
            })
            .eq('user_id', userId);

        if (profileError) {
            // If this failed but it exists in users table, we might need an upsert instead.
            // Given our current schema, the profile should exist if the teacher exists.
            throw new Error(`Profile Update Error: ${profileError.message}`);
        }

        return { success: true, message: 'Teacher successfully updated.' };

    } catch (error: any) {
        console.error('Update Staff Action Error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
