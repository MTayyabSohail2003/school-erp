'use server';

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/mail';
import { StaffFormData, staffFormSchema } from '../schemas/staff.schema';

// We must use the SERVICE_ROLE_KEY to bypass RLS and create Auth users
// without logging the current Admin out of their session.

export async function createStaffAction(data: StaffFormData) {
    try {
        const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseAdminUrl || !supabaseAdminKey) {
            return {
                success: false,
                error: 'Server Misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY in .env file.'
            };
        }

        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        // 1. Validate the input purely on the server again
        const parsed = staffFormSchema.parse(data);

        // 2. Create the user in Supabase Auth using the Admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: parsed.email,
            password: parsed.password,
            email_confirm: true,
            user_metadata: {
                full_name: parsed.full_name,
                role: 'TEACHER', // Hardcoding Teacher role for staff for now
            },
        });

        if (authError) throw new Error(`Auth Error: ${authError.message}`);
        if (!authData.user) throw new Error('User creation failed, no user returned.');

        const newUserId = authData.user.id;

        // 3. Insert into the public.users table (though a trigger might be doing this if you set one up,
        // but since we are handling role explicitely, let's insert or update it).
        // If we don't have a trigger, we must insert. If we do, we might need to just update the role.
        // Assuming we need to insert/update.
        const { error: userError } = await supabaseAdmin.from('users').upsert({
            id: newUserId,
            email: parsed.email,
            full_name: parsed.full_name,
            phone_number: parsed.phone_number,
            avatar_url: parsed.avatar_url || null,
            role: 'TEACHER',
            status: parsed.status || 'ACTIVE',
        });

        if (userError) {
            // Rollback Auth creation if custom table insert fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            throw new Error(`User Table Error: ${userError.message}`);
        }

        // 4. Insert into the public.teacher_profiles table
        const { error: profileError } = await supabaseAdmin.from('teacher_profiles').insert({
            user_id: newUserId,
            qualification: parsed.qualification,
            monthly_salary: parsed.monthly_salary,
            resume_url: parsed.resume_url || null,
        });

        if (profileError) {
            // Rollback both if profile fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            throw new Error(`Profile Error: ${profileError.message}`);
        }
 
        // 5. Send Welcome Email
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const loginUrl = `${siteUrl}/login`;
 
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
                    .header { background-color: #4f46e5; /* Indigo 600 */ padding: 30px 20px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
                    .content { padding: 30px; color: #334155; line-height: 1.6; }
                    .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; }
                    .credentials-box { background-color: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 4px; padding: 20px; margin: 25px 0; }
                    .credentials-box p { margin: 8px 0; font-size: 15px; }
                    .credentials-box strong { color: #0f172a; width: 80px; display: inline-block; }
                    .code { font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #0f172a; font-weight: bold; font-size: 16px; }
                    .btn-container { text-align: center; margin: 35px 0 20px; }
                    .btn { display: inline-block; background-color: #4f46e5; /* Indigo 600 */ color: #ffffff !important; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39); transition: all 0.2s ease; }
                    .footer { text-align: center; padding: 20px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; background: #f8fafc; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>School ERP</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome to the Staff Team, ${parsed.full_name}!</h2>
                        <p>Your official teacher portal account has been successfully created. You can now log in to manage your classes, mark attendance, and track student progress.</p>
                        
                        <div class="credentials-box">
                            <p style="margin-top:0; margin-bottom: 12px; font-weight: 600; color: #0f172a;">Your Login Credentials</p>
                            <p><strong>Email:</strong> <span style="color:#4f46e5;">${parsed.email}</span></p>
                            <p><strong>Password:</strong> <span class="code">${parsed.password}</span></p>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 15px;">
                            For security purposes, please log in and change your password immediately.
                        </p>
                        
                        <div class="btn-container">
                            <a href="${loginUrl}" class="btn">Log In to Teacher Portal</a>
                        </div>
                        
                        <p style="margin-top: 30px; margin-bottom: 0;">Best regards,<br><strong>School Administration</strong></p>
                    </div>
                    <div class="footer">
                        This is an automated message from School ERP. Please do not reply to this email.
                    </div>
                </div>
            </body>
            </html>
        `;
 
        // Run asynchronously so it doesn't block UI
        sendEmail({
            to: parsed.email,
            subject: 'Welcome to School ERP - Your Teacher Account Details',
            html: emailHtml
        });
 
        return { success: true, message: 'Teacher successfully created and invite email sent.' };
 
    } catch (error: unknown) {
        console.error('Create Staff Action Error:', error);
        return { success: false, error: (error as Error).message || 'An unexpected error occurred.' };
    }
}
