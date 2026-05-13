'use server';

import { createClient } from '@/lib/supabase/server';
import { StudentFormData, PromoteStudentsData, BulkStudentFormData, BatchPromoteData } from '../schemas/student.schema';
import { revalidatePath } from 'next/cache';

/**
 * Register a new student with duplicate prevention and auto-fee linking
 */
export async function registerStudentAction(data: StudentFormData) {
    const supabase = await createClient();

    try {
        // 1. Duplicate Prevention (Roll Number & B-Form ID)
        let query = supabase
            .from('students')
            .select('id, roll_number, b_form_id')
            .in('status', ['ACTIVE', 'INACTIVE']);

        // Only check B-Form duplicate if it's provided
        if (data.b_form_id && data.b_form_id.trim() !== '') {
            query = query.or(`roll_number.eq.${data.roll_number},b_form_id.eq.${data.b_form_id}`);
        } else {
            query = query.eq('roll_number', data.roll_number);
        }

        const { data: existingStudent, error: checkError } = await query.maybeSingle();

        if (checkError) return { success: false, error: 'Database verification failed.' };
        if (existingStudent) {
            if (existingStudent.roll_number === data.roll_number) {
                return { success: false, error: `Student with Roll Number ${data.roll_number} already exists.` };
            }
            if (data.b_form_id && existingStudent.b_form_id === data.b_form_id) {
                return { success: false, error: `Student with B-Form ID ${data.b_form_id} already exists.` };
            }
        }

        // 2. Insert Student
        const { data: student, error: insertError } = await supabase
            .from('students')
            .insert({
                roll_number: data.roll_number,
                full_name: data.full_name,
                date_of_birth: data.date_of_birth,
                class_id: data.class_id,
                parent_id: data.parent_id,
                b_form_id: data.b_form_id,
                academic_year: data.academic_year,
                b_form_url: data.b_form_url,
                old_cert_url: data.old_cert_url,
                photo_url: data.photo_url,
                monthly_fee: data.monthly_fee
            })
            .select()
            .single();

        if (insertError) return { success: false, error: insertError.message };

        // 3. Auto-Fee Linking & Initial Challan
        const { data: feeStructure } = await supabase
            .from('fee_structures')
            .select('id, monthly_fee')
            .eq('class_id', data.class_id)
            .maybeSingle();

        if (feeStructure) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const dueDate = new Date();
            dueDate.setDate(10);

            await supabase.from('fee_challans').insert({
                student_id: student.id,
                fee_structure_id: feeStructure.id,
                month_year: currentMonth,
                amount_due: data.monthly_fee || feeStructure.monthly_fee,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'PENDING'
            });
        }

        revalidatePath('/dashboard/students');
        return { success: true, message: `Successfully registered ${data.full_name} and generated initial challan.` };

    } catch (error: Error | unknown) {
        console.error("Registration Error:", error);
        return { success: false, error: (error as Error).message || "An unexpected error occurred during registration." };
    }
}

/**
 * Register multiple students in bulk for a specific class
 */
export async function bulkRegisterStudentsAction(data: BulkStudentFormData) {
    const supabase = await createClient();

    try {
        // Collect all Roll Numbers and B-Forms to check for duplicates
        const rollNumbers = data.students.map(s => s.roll_number);
        const bForms = data.students.map(s => s.b_form_id).filter(b => !!b);

        // 1. Array-level duplicate check (prevent duplicate entries in the same batch)
        if (new Set(rollNumbers).size !== rollNumbers.length) {
            return { success: false, error: 'Duplicate roll numbers found within the form itself. Please correct it before submitting.' };
        }
        if (bForms.length > 0 && new Set(bForms).size !== bForms.length) {
            return { success: false, error: 'Duplicate B-Form IDs found within the form itself. Please correct it before submitting.' };
        }

        // 2. Database-level duplicate check utilizing native parameterized .in() filters
        const [rollsResponse, bformsResponse] = await Promise.all([
            supabase.from('students')
                .select('roll_number')
                .in('roll_number', rollNumbers)
                .in('status', ['ACTIVE', 'INACTIVE']),
            bForms.length > 0
                ? supabase.from('students')
                    .select('b_form_id')
                    .in('b_form_id', bForms)
                    .in('status', ['ACTIVE', 'INACTIVE'])
                : Promise.resolve({ data: [], error: null })
        ]);

        if (rollsResponse.error || bformsResponse.error) {
            return { success: false, error: 'Database verification failed.' };
        }

        if (rollsResponse.data && rollsResponse.data.length > 0) {
            const dupRolls = rollsResponse.data.map(r => r.roll_number);
            return { success: false, error: `Roll number(s) already exist: ${dupRolls.join(', ')}` };
        }

        if (bformsResponse.data && bformsResponse.data.length > 0) {
            const dupBforms = bformsResponse.data.map(b => b.b_form_id);
            return { success: false, error: `B-Form ID(s) already exist: ${dupBforms.join(', ')}` };
        }

        // 2. Insert Students in Bulk
        const recordsToInsert = data.students.map(student => ({
            roll_number: student.roll_number,
            full_name: student.full_name,
            date_of_birth: student.date_of_birth,
            class_id: data.class_id,
            parent_id: student.parent_id || null,
            b_form_id: student.b_form_id || null,
            academic_year: student.academic_year,
            b_form_url: student.b_form_url || null,
            old_cert_url: student.old_cert_url || null,
            photo_url: student.photo_url || null,
            monthly_fee: student.monthly_fee
        }));

        const { data: insertedStudents, error: insertError } = await supabase
            .from('students')
            .insert(recordsToInsert)
            .select('id, monthly_fee');

        if (insertError) return { success: false, error: insertError.message };

        // 3. Auto-Fee Linking
        const { data: feeStructure } = await supabase
            .from('fee_structures')
            .select('id, monthly_fee')
            .eq('class_id', data.class_id)
            .maybeSingle();

        if (feeStructure && insertedStudents) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const dueDate = new Date();
            dueDate.setDate(10);

            const feeChallans = insertedStudents.map(student => ({
                student_id: student.id,
                fee_structure_id: feeStructure.id,
                month_year: currentMonth,
                amount_due: student.monthly_fee || feeStructure.monthly_fee,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'PENDING'
            }));

            await supabase.from('fee_challans').insert(feeChallans);
        }

        revalidatePath('/dashboard/students');
        return { success: true, message: `Successfully registered ${insertedStudents?.length} students.` };

    } catch (error: Error | unknown) {
        console.error("Bulk Registration Error:", error);
        return { success: false, error: (error as Error).message || "An unexpected error occurred during bulk registration." };
    }
}

/**
 * Bulk promote students with history logging and academic year update
 */
export async function promoteStudentsAction(data: PromoteStudentsData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        if (data.is_graduation) {
            // Bulk update to GRADUATED
            const { error: gradError } = await supabase
                .from('students')
                .update({
                    status: 'GRADUATED',
                    academic_year: data.new_academic_year
                })
                .in('id', data.student_ids);

            if (gradError) throw gradError;

            // Log History
            const historyLogs = data.student_ids.map(id => ({
                student_id: id,
                from_class_id: data.source_class_id,
                to_class_id: null,
                academic_year: data.new_academic_year,
                action: 'GRADUATION',
                performed_by: user.id
            }));

            await supabase.from('promotion_history').insert(historyLogs);

        } else {
            if (!data.destination_class_id) throw new Error('Destination class is required for promotion.');

            // Fetch target class for roll prefix calculation
            const { data: targetClass } = await supabase
                .from('classes')
                .select('name, section')
                .eq('id', data.destination_class_id)
                .single();

            if (!targetClass) throw new Error('Target class not found');

            const classNum = targetClass.name.match(/\d+/)?.[0] || targetClass.name;
            const newPrefix = `C${classNum}-${targetClass.section}-`.toUpperCase().replace(/\s+/g, '');

            // 1. Fetch current students to update their roll numbers and capture context
            const { data: studentsToUpdate } = await supabase
                .from('students')
                .select('id, roll_number, academic_year')
                .in('id', data.student_ids);

            if (!studentsToUpdate) throw new Error('Could not fetch students for updates');

            // 2. Perform individual updates
            for (const student of studentsToUpdate) {
                let updatedRoll = student.roll_number;
                if (student.roll_number.includes('-')) {
                    const parts = student.roll_number.split('-');
                    updatedRoll = newPrefix + parts[parts.length - 1];
                } else {
                    updatedRoll = newPrefix + student.roll_number;
                }

                const { error: promoError } = await supabase
                    .from('students')
                    .update({
                        class_id: data.destination_class_id,
                        academic_year: data.new_academic_year,
                        status: 'ACTIVE',
                        roll_number: updatedRoll
                    })
                    .eq('id', student.id);

                if (promoError) throw promoError;
            }

            // 3. Log History
            const historyLogs = studentsToUpdate.map(s => ({
                student_id: s.id,
                from_class_id: data.source_class_id,
                to_class_id: data.destination_class_id,
                from_academic_year: s.academic_year || 'Unknown',
                to_academic_year: data.new_academic_year,
                is_graduation: false
            }));

            await supabase.from('promotion_history').insert(historyLogs);

            // 4. Fee Reset: Generate first month's challan for new class AND update student base fee
            const { data: feeStructure } = await supabase
                .from('fee_structures')
                .select('id, monthly_fee')
                .eq('class_id', data.destination_class_id)
                .maybeSingle();

            if (feeStructure) {
                // UPDATE BASE FEE ON ALL PROMOTED STUDENTS
                await supabase
                    .from('students')
                    .update({ monthly_fee: feeStructure.monthly_fee })
                    .in('id', data.student_ids);

                const currentMonth = new Date().toISOString().slice(0, 7);
                const dueDate = new Date();
                dueDate.setDate(10);

                // DYNAMIC PROMOTION SCENARIO: Handle existing challans for the current month
                for (const studentId of data.student_ids) {
                    const { data: existing } = await supabase
                        .from('fee_challans')
                        .select('id, status')
                        .eq('student_id', studentId)
                        .eq('month_year', currentMonth)
                        .maybeSingle();

                    if (existing) {
                        // If it exists and is PENDING, we update it to the new class fee structure
                        if (existing.status === 'PENDING') {
                            await supabase
                                .from('fee_challans')
                                .update({
                                    fee_structure_id: feeStructure.id,
                                    amount_due: feeStructure.monthly_fee
                                })
                                .eq('id', existing.id);
                        }
                        // If PAID or PARTIAL, we do NOTHING. This is the "Pure Dynamic" requirement
                        // to ensure already collected fees aren't "cleared" or overwritten for the new class.
                    } else {
                        // If no challan exists for this month yet, create a fresh one
                        await supabase.from('fee_challans').insert({
                            student_id: studentId,
                            fee_structure_id: feeStructure.id,
                            month_year: currentMonth,
                            amount_due: feeStructure.monthly_fee,
                            due_date: dueDate.toISOString().split('T')[0],
                            status: 'PENDING'
                        });
                    }
                }
            }
        }

        revalidatePath('/dashboard/students');
        revalidatePath('/dashboard/finance');

        return {
            success: true,
            message: data.is_graduation
                ? `Successfully graduated ${data.student_ids.length} students.`
                : `Successfully promoted ${data.student_ids.length} students.`
        };

    } catch (error: Error | unknown) {
        console.error("Promotion Error:", error);
        return { success: false, error: (error as Error).message || 'Promotion failed.' };
    }
}

/**
 * School-wide batch promotion for all classes at once (Optimized via Postgres RPC)
 */
export async function batchPromoteAllAction(data: BatchPromoteData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const { data: result, error: rpcError } = await supabase.rpc('batch_promote_students_v1', {
            p_mappings: data.mappings,
            p_new_academic_year: data.new_academic_year,
            p_promoted_by: user.id
        });

        if (rpcError) throw rpcError;

        // result is returned as dynamic JSONB, we cast it to our expected shape
        const response = result as {
            success: boolean;
            total_promoted: number;
            total_graduated: number;
            total_repeated: number;
            error?: string
        };

        if (!response.success) {
            throw new Error(response.error || 'Batch promotion function failed on database side.');
        }

        revalidatePath('/dashboard/students');
        revalidatePath('/dashboard/finance');

        return {
            success: true,
            message: `Batch complete: ${response.total_promoted} promoted, ${response.total_graduated} graduated, ${response.total_repeated} repeating.`
        };

    } catch (error: Error | unknown) {
        console.error("Batch Promotion Error:", error);
        return { success: false, error: (error as Error).message || 'Batch promotion failed.' };
    }
}




/**
 * Bulk update monthly fees for all students in a class
 * And optionally update the fee structure for that class
 */
export async function bulkUpdateClassFeesAction(classId: string, newFee: number, updateStructure: boolean = true) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        // 1. Fetch Students in the class first to get IDs
        const { data: students, error: fetchError } = await supabase
            .from('students')
            .select('id')
            .eq('class_id', classId)
            .eq('status', 'ACTIVE');

        if (fetchError) throw fetchError;
        const studentIds = students.map(s => s.id);

        if (studentIds.length === 0 && !updateStructure) {
            return { success: true, message: "No active students to update, structure update skipped." };
        }

        // 2. Update all ACTIVE students in this class
        const { error: studentUpdateError } = await supabase
            .from('students')
            .update({ monthly_fee: newFee })
            .in('id', studentIds);

        if (studentUpdateError) throw studentUpdateError;

        // 3. SMART SYNC: Update existing PENDING and OVERDUE challans
        // We skip PAID and PARTIAL to preserve historical payment integrity
        if (studentIds.length > 0) {
            const { error: challanError } = await supabase
                .from('fee_challans')
                .update({ amount_due: newFee })
                .in('student_id', studentIds)
                .in('status', ['PENDING', 'OVERDUE']);

            if (challanError) {
                console.error("Challan Sync Error:", challanError);
                // We don't throw here to ensure the core student update persists, but we log it
            }
        }

        // 4. Update the Fee Structure if requested
        if (updateStructure) {
            const { data: existing } = await supabase
                .from('fee_structures')
                .select('id')
                .eq('class_id', classId)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('fee_structures')
                    .update({ monthly_fee: newFee })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('fee_structures')
                    .insert({ class_id: classId, monthly_fee: newFee });
            }
        }

        revalidatePath('/dashboard/students');
        revalidatePath('/dashboard/finance');

        return {
            success: true,
            message: `Updated fees for ${studentIds.length} students and synchronized pending records.`
        };

    } catch (error: Error | unknown) {
        console.error("Bulk Fee Update Error:", error);
        return { success: false, error: (error as Error).message || 'Fee update failed.' };
    }
}
