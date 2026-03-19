'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';
import { broadcastNotification, sendDirectNotification } from '@/features/notifications/actions/notification-actions';

// Types
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LeaveRequest = {
    id: string;
    student_id: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: LeaveRequestStatus;
    applied_by: string;
    created_at: string;
    student?: {
        full_name: string;
        roll_number: string;
        class?: { name: string; section: string };
    };
    applicant?: { full_name: string };
};

// Validation Schema
const createLeaveSchema = z.object({
    student_id: z.string().uuid("Invalid student selected"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().min(10, "Reason must be at least 10 characters long").max(500, "Reason is too long"),
});

// Helper to get Supabase Client
const getSupabase = async () => {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                    }
                },
            },
        }
    );
};

export async function createLeaveRequest(formData: z.infer<typeof createLeaveSchema>) {
    try {
        const supabase = await getSupabase();

        // 1. Verify Authentication
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
            return { error: 'You must be logged in to apply for leave' };
        }

        const userId = authData.user.id;

        // 2. Validate Input
        const validation = createLeaveSchema.safeParse(formData);
        if (!validation.success) {
            return { error: validation.error.issues[0].message };
        }

        const data = validation.data;

        // 3. Ensure start_date is before or same as end_date
        if (new Date(data.start_date) > new Date(data.end_date)) {
            return { error: 'Start date cannot be after end date' };
        }

        // 4. Fetch student name for the notification message
        // Use admin client to follow system logic regardless of Parent RLS
        const adminSupabase = createAdminClient();
        const { data: student, error: studentError } = await adminSupabase
            .from('students')
            .select('full_name, parent_id')
            .eq('id', data.student_id)
            .single();
        
        if (studentError) {
            console.error('Error fetching student for leave notice:', studentError);
        }

        // 5. Insert Request
        const { error } = await supabase
            .from('leave_requests')
            .insert({
                student_id: data.student_id,
                start_date: data.start_date,
                end_date: data.end_date,
                reason: data.reason,
                applied_by: userId,
                status: 'PENDING'
            });

        if (error) {
            console.error('Error inserting leave request:', error);
            if (error.code === '42501') {
                return { error: 'You do not have permission to apply leave for this student.' };
            }
            return { error: 'Failed to submit leave request: ' + error.message };
        }

        // 6. Notify all admins (non-blocking)
        if (student?.full_name) {
            console.log('Broadcasting leave notification for:', student.full_name);
            await broadcastNotification(['ADMIN'], NotificationTemplates.LEAVE_REQUEST_SUBMITTED(student.full_name));
        } else {
            console.warn('Cannot send notification: Student full_name is missing', { student });
        }

        revalidatePath('/dashboard/attendance/leaves');
        return { success: true };

    } catch {
        console.error('Unhandled error in createLeaveRequest');
        return { error: 'An unexpected error occurred.' };
    }
}

// ... (Removed local notifyAllAdminsServerSide)

export async function getLeaveRequests(date?: string) {
    try {
        const supabase = await getSupabase();

        let query = supabase
            .from('leave_requests')
            .select(`
                *,
                student:students (
                    full_name,
                    roll_number,
                    class:classes (name, section)
                ),
                applicant:users!leave_requests_applied_by_fkey (full_name)
            `)
            .order('created_at', { ascending: false });

        // Filter by date if provided (match where start_date equals the selected date)
        if (date) {
            query = query.eq('start_date', date);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching leave requests:', error);
            return { error: 'Failed to load leave requests' };
        }

        return { data: data as LeaveRequest[] };

    } catch {
        return { error: 'An unexpected error occurred while loading requests.' };
    }
}

export async function updateLeaveRequestStatus(id: string, status: LeaveRequestStatus) {
    try {
        const supabase = await getSupabase();

        // 1. Fetch the leave request details before updating for the notification
        const { data: leaveRequest } = await supabase
            .from('leave_requests')
            .select(`
                applied_by,
                student:students (full_name)
            `)
            .eq('id', id)
            .single();

        // 2. Update status
        const { error } = await supabase
            .from('leave_requests')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('Error updating leave request:', error);
            if (error.code === '42501') {
                return { error: 'You do not have permission to update leave requests.' };
            }
            return { error: 'Failed to update leave request status.' };
        }

        // 3. Notify the parent who submitted the request
        if (leaveRequest?.applied_by) {
            const studentName = Array.isArray(leaveRequest.student)
                ? (leaveRequest.student as unknown as { full_name: string }[])[0]?.full_name ?? 'your child'
                : (leaveRequest.student as unknown as { full_name: string } | null)?.full_name ?? 'your child';

            const template = status === 'APPROVED'
                ? NotificationTemplates.LEAVE_REQUEST_APPROVED(studentName)
                : NotificationTemplates.LEAVE_REQUEST_REJECTED(studentName);

            await sendDirectNotification(leaveRequest.applied_by, template);
        }

        revalidatePath('/dashboard/attendance/leaves');
        return { success: true };

    } catch {
        return { error: 'An unexpected error occurred while updating status.' };
    }
}

export async function deleteLeaveRequest(id: string) {
    try {
        const supabase = await getSupabase();

        // Check permissions/auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { error } = await supabase
            .from('leave_requests')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting leave request:', error);
            return { error: 'Failed to delete leave request. ' + error.message };
        }

        revalidatePath('/dashboard/attendance/leaves');
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        return { error: 'An unexpected error occurred: ' + error.message };
    }
}
