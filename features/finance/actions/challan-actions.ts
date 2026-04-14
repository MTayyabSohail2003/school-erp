'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { type FeeChallan, type ChallanStatus } from '../schemas/fee-challan.schema';
import { sendDirectNotification } from '@/features/notifications/actions/notification-actions';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';

export async function updateChallanStatusAction(
    id: string, 
    data: {
        status: ChallanStatus;
        paymentMethod?: 'CASH' | 'BANK' | 'ONLINE';
        paidAmount?: number;
        fines?: number;
        discount?: number;
        paidNotes?: string;
    }
) {
    try {
        const supabase = createAdminClient();
        
        // 1. Fetch current challan info
        const { data: challan } = await supabase
            .from('fee_challans')
            .select(`
                amount_due,
                arrears,
                student:students (
                    full_name,
                    parent_id
                )
            `)
            .eq('id', id)
            .single();

        if (!challan) throw new Error('Challan not found');

        const { status, paymentMethod, paidAmount, fines, discount, paidNotes } = data;
        
        const payload: Partial<FeeChallan> = { 
            status,
            fines: fines ?? 0,
            discount: discount ?? 0,
            paid_amount: paidAmount ?? 0,
            paid_notes: paidNotes ?? null,
        };
        
        if (status === 'PAID' || status === 'PARTIAL') {
            payload.paid_date = new Date().toISOString().split('T')[0];
            if (paymentMethod) payload.payment_method = paymentMethod;
        } else {
            payload.paid_date = null;
            payload.payment_method = null;
        }

        // 2. Update challan record
        const { error } = await supabase
            .from('fee_challans')
            .update(payload)
            .eq('id', id);

        if (error) throw new Error(error.message);

        // 3. If PAID, notify parent
        if (status === 'PAID' && challan?.student) {
            const student = challan.student as unknown as { full_name: string; parent_id: string };
            if (student.parent_id) {
                await sendDirectNotification(
                    student.parent_id, 
                    NotificationTemplates.FEE_RECEIVED(student.full_name, challan.amount_due)
                );
            }
        }

        revalidatePath('/dashboard/finance');
        revalidatePath('/dashboard/fees');
        
        return { success: true };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error in updateChallanStatusAction:', errorMessage);
        return { success: false, error: errorMessage };
    }
}
