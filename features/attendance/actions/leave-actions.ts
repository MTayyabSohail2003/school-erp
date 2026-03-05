'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

// Notify all admins (server-side helper)
const notifyAdminsOfLeave = async (
    supabase: Awaited<ReturnType<typeof getSupabase>>,
    studentName: string,
) => {
    const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'ADMIN');

    if (!admins || admins.length === 0) return;

    await supabase.from('notifications').insert(
        admins.map((admin: { id: string }) => ({
            recipient_id: admin.id,
            title: 'New Leave Request',
            message: `A leave request has been submitted for ${studentName}. Please review and take action.`,
            type: 'INFO',
            link: '/dashboard/attendance/leaves',
            is_read: false,
        })),
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
        const { data: student } = await supabase
            .from('students')
            .select('full_name, parent_id')
            .eq('id', data.student_id)
            .single();

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
            await notifyAdminsOfLeave(supabase, student.full_name);
        }

        revalidatePath('/dashboard/attendance/leaves');
        return { success: true };

    } catch {
        console.error('Unhandled error in createLeaveRequest');
        return { error: 'An unexpected error occurred.' };
    }
}

export async function getLeaveRequests() {
    try {
        const supabase = await getSupabase();

        const { data, error } = await supabase
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
            const statusLabel = status === 'APPROVED' ? 'approved ✅' : 'rejected ❌';
            await supabase.from('notifications').insert({
                recipient_id: leaveRequest.applied_by,
                title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
                message: `The leave request for ${studentName} has been ${statusLabel}.`,
                type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
                link: '/dashboard/attendance/leaves',
                is_read: false,
            });
        }

        revalidatePath('/dashboard/attendance/leaves');
        return { success: true };

    } catch {
        return { error: 'An unexpected error occurred while updating status.' };
    }
}
