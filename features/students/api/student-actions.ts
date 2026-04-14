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
        const { data: existingStudent, error: checkError } = await supabase
            .from('students')
            .select('id, roll_number, b_form_id')
            .or(`roll_number.eq.${data.roll_number},b_form_id.eq.${data.b_form_id}`)
            .in('status', ['ACTIVE', 'INACTIVE'])
            .maybeSingle();

        if (checkError) return { success: false, error: 'Database verification failed.' };
        if (existingStudent) {
            if (existingStudent.roll_number === data.roll_number) {
                return { success: false, error: `Student with Roll Number ${data.roll_number} already exists.` };
            }
            if (existingStudent.b_form_id === data.b_form_id) {
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

                const challans = data.student_ids.map(id => ({
                    student_id: id,
                    fee_structure_id: feeStructure.id,
                    month_year: currentMonth,
                    amount_due: feeStructure.monthly_fee,
                    due_date: dueDate.toISOString().split('T')[0],
                    status: 'PENDING'
                }));

                await supabase.from('fee_challans').insert(challans);
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
 * School-wide batch promotion for all classes at once
 */
export async function batchPromoteAllAction(data: BatchPromoteData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        let totalPromoted = 0;
        let totalGraduated = 0;
        let totalRepeated = 0;

        // 1. Safe Processing: Fetch ALL relevant students and classes FIRST
        // This prevents the "ladder" bug where updated students are caught in subsequent mapping queries
        const sourceClassIds = data.mappings.map(m => m.source_class_id);
        const destinationClassIds = data.mappings
            .map(m => m.destination_class_id)
            .filter((id): id is string => !!id);
        
        const allClassIds = Array.from(new Set([...sourceClassIds, ...destinationClassIds]));

        const [{ data: allSourceStudents }, { data: allClasses }, { data: allFeeStructures }] = await Promise.all([
            supabase
                .from('students')
                .select('*, classes(name, section)')
                .in('class_id', sourceClassIds)
                .eq('status', 'ACTIVE'),
            supabase
                .from('classes')
                .select('id, name, section')
                .in('id', allClassIds),
            supabase
                .from('fee_structures')
                .select('class_id, monthly_fee')
                .in('class_id', allClassIds)
        ]);

        if (!allSourceStudents) throw new Error("Could not fetch student records.");
        const classMap = Object.fromEntries((allClasses || []).map(c => [c.id, c]));
        const feeMap = Object.fromEntries((allFeeStructures || []).map(f => [f.class_id, f.monthly_fee]));

        // Helper to update roll number prefix (e.g., C2-A-001 -> C3-A-001)
        const getUpdatedRollNumber = (oldRoll: string, targetClassId: string | null) => {
            if (!targetClassId || !classMap[targetClassId]) return oldRoll;
            
            const targetClass = classMap[targetClassId];
            const classNum = targetClass.name.match(/\d+/)?.[0] || targetClass.name;
            const newPrefix = `C${classNum}-${targetClass.section}-`.toUpperCase().replace(/\s+/g, '');
            
            // If it's already a standard formatted roll number, swap prefix
            if (oldRoll.includes('-')) {
                const parts = oldRoll.split('-');
                const suffix = parts[parts.length - 1];
                return newPrefix + suffix;
            }
            
            // Fallback for non-standard formats
            return newPrefix + oldRoll;
        };

        // 2. Prepare all pending updates first to free the namespace
        const pendingUpdates = [];

        for (const mapping of data.mappings) {
            const studentsInClass = allSourceStudents.filter(s => s.class_id === mapping.source_class_id);
            if (studentsInClass.length === 0) continue;

            const excludedIds = mapping.excluded_student_ids || [];
            const rollOverrides = mapping.roll_number_overrides || {};

            for (const student of studentsInClass) {
                const isExcluded = excludedIds.includes(student.id);
                const manualOverride = rollOverrides[student.id];
                const isGraduation = !isExcluded && (mapping.is_graduation || !mapping.destination_class_id);
                
                let targetRoll = student.roll_number;
                let targetClassId = student.class_id;
                let targetStatus: 'ACTIVE' | 'GRADUATED' = 'ACTIVE';

                if (isExcluded) {
                    targetRoll = manualOverride || student.roll_number;
                    targetClassId = mapping.source_class_id;
                } else if (isGraduation) {
                    targetRoll = manualOverride || student.roll_number;
                    targetClassId = null;
                    targetStatus = 'GRADUATED';
                } else {
                    targetRoll = manualOverride || getUpdatedRollNumber(student.roll_number, mapping.destination_class_id);
                    targetClassId = mapping.destination_class_id;
                }

                pendingUpdates.push({
                    student,
                    targetRoll,
                    targetClassId,
                    targetStatus,
                    // Prioritize: Mapping-specific fee > Database structure fee > Current record fee
                    targetMonthlyFee: targetClassId 
                        ? (mapping.target_monthly_fee ?? feeMap[targetClassId]) 
                        : student.monthly_fee,
                    isGraduation,
                    isRepeat: isExcluded
                });
            }
        }

        // --- STAGE 1: Free the ACTIVE roll number namespace ---
        // We move everyone to a temporary roll number to avoid 'duplicate key' collisions 
        // during the migration, especially on sequential updates.
        for (const update of pendingUpdates) {
            const { error: tempError } = await supabase
                .from('students')
                .update({ 
                    roll_number: `TMP-${update.student.id.slice(0, 8)}-${update.student.roll_number}`.toUpperCase()
                })
                .eq('id', update.student.id);
            
            if (tempError) {
                console.error(`Namespace Clearance Failed for ${update.student.full_name}:`, tempError);
                throw new Error(`Failed to clear roll number for ${update.student.full_name}: ${tempError.message}`);
            }
        }

        // --- STAGE 2: Apply official new session state ---
        for (const update of pendingUpdates) {
            const { error: finalError } = await supabase
                .from('students')
                .update({
                    class_id: update.targetClassId,
                    academic_year: data.new_academic_year,
                    status: update.targetStatus,
                    roll_number: update.targetRoll,
                    monthly_fee: update.targetMonthlyFee
                })
                .eq('id', update.student.id);
            
            if (finalError) {
                console.error(`Final Update Failed for ${update.student.full_name}:`, finalError);
                throw new Error(`Failed to finalize promotion for ${update.student.full_name}: ${finalError.message}`);
            }

            // Log History
            await supabase.from('promotion_history').insert({
                student_id: update.student.id,
                from_class_id: update.student.class_id,
                to_class_id: update.targetClassId,
                from_academic_year: update.student.academic_year || 'Unknown',
                to_academic_year: data.new_academic_year,
                is_graduation: update.isGraduation
            });

            // Fee Reset logic for non-graduating students
            if (!update.isGraduation && update.targetClassId) {
                const { data: feeStructure } = await supabase
                    .from('fee_structures')
                    .select('id, monthly_fee')
                    .eq('class_id', update.targetClassId)
                    .maybeSingle();

                if (feeStructure) {
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const dueDate = new Date();
                    dueDate.setDate(10);

                    // Note: update.targetMonthlyFee was already committed to the student record in Stage 2
                    await supabase.from('fee_challans').insert({
                        student_id: update.student.id,
                        fee_structure_id: feeStructure.id,
                        month_year: currentMonth,
                        amount_due: update.targetMonthlyFee ?? feeStructure.monthly_fee,
                        due_date: dueDate.toISOString().split('T')[0],
                        status: 'PENDING'
                    });
                }
            }

            if (update.isGraduation) totalGraduated++;
            else if (update.isRepeat) totalRepeated++;
            else totalPromoted++;
        }

        // --- STAGE 3: Sync Fee Structures for future-proofing ---
        for (const mapping of data.mappings) {
            if (mapping.destination_class_id && mapping.target_monthly_fee !== undefined) {
                const { data: existing } = await supabase
                    .from('fee_structures')
                    .select('id')
                    .eq('class_id', mapping.destination_class_id)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('fee_structures')
                        .update({ monthly_fee: mapping.target_monthly_fee })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('fee_structures')
                        .insert({ 
                            class_id: mapping.destination_class_id, 
                            monthly_fee: mapping.target_monthly_fee 
                        });
                }
            }
        }

        revalidatePath('/dashboard/students');
        revalidatePath('/dashboard/finance');

        return { 
            success: true, 
            message: `Batch complete: ${totalPromoted} promoted, ${totalGraduated} graduated, ${totalRepeated} repeating.` 
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
