'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const EditParentSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone_number: z.string().min(10, 'Phone number should be valid').optional().or(z.literal('')),
});

export type EditParentInput = z.infer<typeof EditParentSchema>;

export async function editParentAction(data: EditParentInput) {
    try {
        const validatedData = EditParentSchema.parse(data);

        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Update the public.users profile record (Primary Source)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({
                full_name: validatedData.full_name,
                email: validatedData.email,
                phone_number: validatedData.phone_number || null,
            })
            .eq('id', validatedData.id)
            .eq('role', 'PARENT');

        if (dbError) {
            console.error('Failed to update parent profile:', dbError);
            return {
                success: false,
                error: `Failed to update profile data: ${dbError.message}`,
            };
        }

        // 2. Optional: Update the Auth User (if they happen to have an account)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(validatedData.id, {
            email: validatedData.email,
        });

        if (authError && !authError.message.includes('User not found')) {
            console.warn('Optional Auth update failed:', authError.message);
        }

        revalidatePath('/dashboard/parents');
        revalidatePath('/settings/parents');

        return {
            success: true,
            message: 'Parent record updated successfully',
        };

    } catch (err: unknown) {
        console.error('Edit Parent Action Error:', err);
        if (err instanceof z.ZodError) {
            return { success: false, error: err.issues[0]?.message || 'Validation failed' };
        }
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An unexpected error occurred',
        };
    }
}
