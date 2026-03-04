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

    updateChallanStatus: async (id: string, status: ChallanStatus) => {
        const supabase = createClient();
        const payload: Partial<FeeChallan> = { status };
        if (status === 'PAID') {
            payload.paid_date = new Date().toISOString().split('T')[0];
        } else {
            payload.paid_date = null;
        }

        const { error } = await supabase
            .from('fee_challans')
            .update(payload)
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    generateChallansForMonth: async (monthYear: string) => {
        const supabase = createClient();

        // 1. Get all fee structures
        const { data: structures } = await supabase.from('fee_structures').select('*');
        if (!structures || structures.length === 0) throw new Error('No fee structures exist');

        const feeMap = new Map(structures.map(s => [s.class_id, { id: s.id, fee: s.monthly_fee }]));

        // 2. Get all students
        const { data: students } = await supabase.from('students').select('id, class_id');
        if (!students) throw new Error('No students found');

        // 3. Get existing challans for this month to avoid duplicates
        const { data: existing } = await supabase
            .from('fee_challans')
            .select('student_id')
            .eq('month_year', monthYear);

        const existingSet = new Set((existing ?? []).map(e => e.student_id));

        // 4. Build inserts for students who have a fee structure and no existing challan this month
        const inserts: Partial<FeeChallan>[] = [];

        // Due date = 10th of the given month (monthYear format: YYYY-MM)
        const dueDate = `${monthYear}-10`;

        for (const student of students) {
            if (existingSet.has(student.id)) continue; // Already generated

            const structure = feeMap.get(student.class_id);
            if (!structure) continue; // No fee configured for this class yet

            inserts.push({
                student_id: student.id,
                fee_structure_id: structure.id,
                month_year: monthYear,
                amount_due: structure.fee,
                status: 'PENDING',
                due_date: dueDate,
            });
        }

        if (inserts.length === 0) return { count: 0, message: 'All challans already generated or no students eligible' };

        // 5. Bulk insert
        const { error } = await supabase.from('fee_challans').insert(inserts);
        if (error) throw new Error(error.message);

        return { count: inserts.length, message: `Successfully generated ${inserts.length} challans` };
    },
};
