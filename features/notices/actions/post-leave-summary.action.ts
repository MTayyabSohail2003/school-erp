'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastNotification } from '@/features/notifications/actions/notification-actions';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';
import { revalidatePath } from 'next/cache';
import { ROUTES } from '@/constants/globals';
import { format } from 'date-fns';

/** Fetches a given day's leave requests and posts a formatted summary notice to the Teacher board.
 *  @param dateISO - YYYY-MM-DD date string. Defaults to today.
 */
export async function postTodayLeaveSummary(dateISO?: string) {
    const adminSupabase = createAdminClient();

    const targetDate = dateISO ?? format(new Date(), 'yyyy-MM-dd');
    const displayDate = format(new Date(targetDate + 'T00:00:00'), 'MMMM d, yyyy');

    // Fetch all leave requests processed today (approved or rejected)
    const { data: leaves, error } = await adminSupabase
        .from('leave_requests')
        .select(`
            status,
            start_date,
            end_date,
            reason,
            student:students (full_name, roll_number, class:classes (name, section))
        `)
        .eq('start_date', targetDate)
        .in('status', ['APPROVED', 'REJECTED'])
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    if (!leaves || leaves.length === 0) {
        return { error: 'No processed leave requests found for today.' };
    }

    const approved = leaves.filter(l => l.status === 'APPROVED');
    const rejected = leaves.filter(l => l.status === 'REJECTED');

    interface StudentInfo {
        full_name: string | null;
        roll_number: string | null;
        class: { name: string; section: string } | { name: string; section: string }[] | null;
    }

    interface LeaveWithStudent {
        student: StudentInfo | StudentInfo[] | null;
    }

    // Helper to format student details
    const formatStudent = (l: LeaveWithStudent) => {
        const student = Array.isArray(l.student) ? l.student[0] : l.student;
        const clsRaw = student?.class;
        const cls = Array.isArray(clsRaw) ? clsRaw[0] : clsRaw;
        
        return `- ${student?.full_name ?? 'Unknown Student'} [${student?.roll_number ?? 'N/A'}] (${cls?.name ?? 'Unknown Class'} ${cls?.section ?? ''})`;
    };

    const bodyChunks = [`📋 Leave Summary for ${displayDate}`, ''];
    
    if (approved.length > 0) {
        bodyChunks.push(`✅ APPROVED (${approved.length}):`);
        approved.forEach(l => bodyChunks.push(formatStudent(l)));
        bodyChunks.push('');
    }

    if (rejected.length > 0) {
        bodyChunks.push(`❌ REJECTED (${rejected.length}):`);
        rejected.forEach(l => bodyChunks.push(formatStudent(l)));
        bodyChunks.push('');
    }

    bodyChunks.push('──────────────');
    bodyChunks.push('Please visit the Leave Management page for full request details and reasons.');

    const body = bodyChunks.join('\n');
    
    const title = `Leave Summary - ${displayDate}`;

    // Fetch any admin user to use as posted_by (required by FK constraint)
    const { data: adminUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1)
        .single();

    const postedBy = adminUser?.id ?? null;

    // Insert notice targeted at teachers
    const { error: insertError } = await adminSupabase.from('notices').insert({
        title,
        body,
        posted_by: postedBy,
        target_audience: 'TEACHER',
    });

    if (insertError) return { error: insertError.message };

    // Notify all teachers
    await broadcastNotification(
        ['TEACHER'],
        NotificationTemplates.LEAVE_SUMMARY_POSTED(displayDate, leaves.length)
    );

    revalidatePath(ROUTES.TEACHER_NOTICE_BOARD);
    revalidatePath(ROUTES.NOTICE_BOARD);

    return { success: true, count: leaves.length };
}
