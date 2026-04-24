import { createClient } from '@/lib/supabase/client';
import { type FeeStructureFormValues, type FeeStructure } from '../schemas/fee-structure.schema';
import { type FeeChallan, type ChallanStatus } from '../schemas/fee-challan.schema';

export const financeApi = {
    getFeeStructures: async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('fee_structures')
            .select('*, classes(name, section)')
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return data as FeeStructure[];
    },

    upsertFeeStructure: async (payload: FeeStructureFormValues) => {
        const supabase = createClient();
        // Uses upsert on class_id to ensure only 1 fee structure per class
        // Assuming unique constraint exists on class_id in fee_structures table (or just using standard id if updating)
        // If no ID is provided, Supabase upsert requires an ON CONFLICT column if we want to overwrite based on class_id.
        // Let's explicitly check if one exists for the class first if we don't have an ID, or just pass id if we do.

        const upsertData = { ...payload };

        if (!upsertData.id) {
            // Check if one already exists for this class
            const { data: existing } = await supabase
                .from('fee_structures')
                .select('id')
                .eq('class_id', payload.class_id)
                .single();

            if (existing) {
                upsertData.id = existing.id;
            } else {
                delete upsertData.id;
            }
        }

        const { data, error } = await supabase
            .from('fee_structures')
            .upsert(upsertData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    getChallans: async (monthYear?: string, status?: string) => {
        const supabase = createClient();
        let query = supabase
            .from('fee_challans')
            .select('*, students(full_name, roll_number, classes(name, section))')
            .order('created_at', { ascending: false });

        if (monthYear) query = query.eq('month_year', monthYear);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data as unknown as FeeChallan[];
    },

    updateChallanStatus: async (id: string, payload: Partial<FeeChallan>) => {
        const supabase = createClient();
        
        const { error } = await supabase
            .from('fee_challans')
            .update(payload)
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    generateChallansForMonth: async (monthYear: string) => {
        const supabase = createClient();

        const { data, error } = await supabase.rpc('generate_monthly_challans_v1', {
            p_month_year: monthYear
        });

        if (error) throw error;
        
        const response = data as { success: boolean; count: number; message: string; error?: string };
        if (!response.success) throw new Error(response.error || 'Fee generation failed on database side.');

        return response;
    },

};
