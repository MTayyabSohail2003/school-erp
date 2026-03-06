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

        // 1. Update the Auth User (Email First, as it's the more sensitive operation)
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(validatedData.id, {
            email: validatedData.email,
        });

        if (authError) {
            console.error('Failed to update parent auth email:', authError);
            return {
                success: false,
                error: `Failed to update login email: ${authError.message}`,
            };
        }

        // 2. Update the public.users profile record
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({
                full_name: validatedData.full_name,
                email: validatedData.email,
                phone_number: validatedData.phone_number || null,
            })
            .eq('id', validatedData.id)
            .eq('role', 'PARENT'); // Extra security check

        if (dbError) {
            console.error('Failed to update parent profile:', dbError);
            return {
                success: false,
                error: `Failed to update profile data: ${dbError.message}`,
            };
        }

        revalidatePath('/dashboard/parents');

        return {
            success: true,
            message: 'Parent updated successfully',
        };

    } catch (err: unknown) {
        console.error('Edit Parent Action Error:', err);
        if (err instanceof z.ZodError) {
            const zodError = err as z.ZodError;
            return { success: false, error: zodError.errors[0]?.message || 'Validation failed' };
        }
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An unexpected error occurred',
        };
    }
}
