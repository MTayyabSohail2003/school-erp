'use server';

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/mail';

export async function sendFeeRemindersAction(parentId?: string) {
    try {
        const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseAdminUrl || !supabaseAdminKey) {
            return {
                success: false,
                error: 'Server Misconfiguration: ...'
            };
        }

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Query parents directly
        let query = supabaseAdmin
            .from('users')
            .select(`
                id,
                full_name,
                email,
                students (
                    full_name
                )
            `)
            .eq('role', 'PARENT');

        if (parentId) {
            query = query.eq('id', parentId);
        }

        const { data: parents, error } = await query;

        if (error) {
            console.error('Error fetching parents:', error);
            throw new Error(`Database Error: ${error.message}`);
        }

        if (!parents || parents.length === 0) {
            return { success: true, count: 0, message: 'No parents found to send reminders to.' };
        }

        // Send emails
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const emailPromises = parents.map(async (parent: any) => {
            if (!parent.email) return Promise.resolve();

            // Format children names
            let studentsList = 'your child/children';
            if (parent.students && parent.students.length > 0) {
                studentsList = parent.students.map((s: { full_name: string }) => s.full_name).join(', ');
            }

            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
                        .header { background-color: #ef4444; /* Red 500 */ padding: 30px 20px; text-align: center; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
                        .content { padding: 30px; color: #334155; line-height: 1.6; }
                        .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; }
                        .message-box { background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 20px; margin: 25px 0; }
                        .footer { text-align: center; padding: 20px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; background: #f8fafc; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Fee Reminder</h1>
                        </div>
                        <div class="content">
                            <h2>Dear ${parent.full_name},</h2>
                            <p>This is a gentle reminder regarding the school fees for <strong>${studentsList}</strong>.</p>
                            
                            <div class="message-box">
                                <p style="margin: 0; color: #991b1b; font-size: 15px; font-weight: 500;">
                                    Please ensure that any current or pending fee dues are cleared as soon as possible to avoid any late fines or interruptions in services.
                                </p>
                            </div>
                            
                            <p style="margin-top: 30px; margin-bottom: 0;">You can check your exact fee details by logging into the parent portal.</p>
                            
                            <p style="margin-top: 30px; margin-bottom: 0;">Warm regards,<br><strong>School Administration</strong></p>
                        </div>
                        <div class="footer">
                            This is an automated message from School ERP. Please do not reply to this email.
                        </div>
                    </div>
                </body>
                </html>
            `;

            return sendEmail({
                to: parent.email,
                subject: 'Action Required: General Fee Reminder - School ERP',
                html: emailHtml
            });
        });

        // Use Promise.allSettled so that if one email fails, others still get sent
        await Promise.allSettled(emailPromises);

        return {
            success: true,
            count: parents.length,
            message: `Successfully sent reminders to ${parents.length} parent(s).`
        };

    } catch (error: unknown) {
        console.error('Send Fee Reminders Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
