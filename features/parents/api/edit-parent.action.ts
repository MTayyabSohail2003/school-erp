'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const EditParentSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone_number: z.string().min(10, 'Phone number should be valid').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
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

        const updateData: { email: string; password?: string } = {
            email: validatedData.email,
        };
        if (validatedData.password) {
            updateData.password = validatedData.password;
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(validatedData.id, updateData);

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
        revalidatePath('/settings/parents');

        // 3. Send Notification Email
        const { sendEmail } = await import('@/lib/mail');
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
                    .header { background-color: #0f172a; padding: 30px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
                    .content { padding: 40px; color: #334155; line-height: 1.6; }
                    .content h2 { color: #0f172a; margin-top: 0; font-size: 20px; }
                    .info-grid { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0; }
                    .info-item { margin: 10px 0; font-size: 15px; }
                    .info-item strong { color: #0f172a; width: 120px; display: inline-block; }
                    .footer { text-align: center; padding: 20px; font-size: 13px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>School ERP</h1>
                    </div>
                    <div class="content">
                        <h2>Profile Updated</h2>
                        <p>Hello <strong>${validatedData.full_name}</strong>,</p>
                        <p>This is a confirmation that your parent profile has been successfully updated by the school administrator.</p>
                        
                        <div class="info-grid">
                            <p style="margin-top:0; margin-bottom: 12px; font-weight: 600; color: #0f172a;">Your Updated Information:</p>
                            <div className="info-item"><strong>Full Name:</strong> ${validatedData.full_name}</div>
                            <div className="info-item"><strong>Email:</strong> ${validatedData.email}</div>
                            <div className="info-item"><strong>Phone:</strong> ${validatedData.phone_number || 'Not provided'}</div>
                            ${validatedData.password ? `<div className="info-item"><strong>New Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${validatedData.password}</code></div>` : ''}
                        </div>
                        
                        <p>If you did not request these changes or have any concerns, please contact the school administration office immediately.</p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="https://ak-school-erp.vercel.app/login" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">Login to Portal (Live)</a>
                            <div style="margin-top: 15px; font-size: 13px; color: #64748b;">
                                Local Access: <a href="http://localhost:3000/login" style="color: #0f172a; text-decoration: underline;">localhost:3000</a>
                            </div>
                        </div>

                        <p style="margin-top: 30px; margin-bottom: 0;">Best regards,<br><strong>School Administration</strong></p>
                    </div>
                    <div class="footer">
                        This is an automated message. Please do not reply.
                    </div>
                </div>
            </body>
            </html>
        `;

        // Run asynchronously
        sendEmail({
            to: validatedData.email,
            subject: 'Your Profile Has Been Updated - School ERP',
            html: emailHtml,
        }).catch((err: Error) => console.error('Failed to send update email:', err));

        return {
            success: true,
            message: 'Parent updated successfully',
        };

    } catch (err: unknown) {
        console.error('Edit Parent Action Error:', err);
        if (err instanceof z.ZodError) {
            return { success: false, error: err.issues[0]?.message || 'Validation failed' };
        }
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An unexpected error occurred',
        };
    }
}
