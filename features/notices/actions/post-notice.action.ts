'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { broadcastNotification } from '@/features/notifications/actions/notification-actions';
import { NotificationTemplates } from '@/features/notifications/utils/notification-templates';
import { type NoticeAudience } from '@/features/notices/api/use-notices';
import { ROUTES } from '@/constants/globals';

const postNoticeSchema = z.object({
    title: z.string().min(3, 'Title too short'),
    body: z.string().min(10, 'Message too short'),
    target_audience: z.enum(['TEACHER', 'PARENT', 'ALL']),
});

const getSupabase = async () => {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { /* server component context */ }
                },
            },
        }
    );
};

/** Post a targeted notice and broadcast a real-time notification to the audience. */
export async function postNotice(input: z.infer<typeof postNoticeSchema>) {
    const parsed = postNoticeSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, body, target_audience } = parsed.data;

    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
        .from('notices')
        .insert({ title, body, posted_by: user.id, target_audience });

    if (error) return { error: error.message };

    // Send real-time notifications to the targeted audience
    if (target_audience === 'TEACHER' || target_audience === 'ALL') {
        await broadcastNotification(
            ['TEACHER'],
            NotificationTemplates.NOTICE_POSTED_TEACHER(title)
        );
    }

    if (target_audience === 'PARENT' || target_audience === 'ALL') {
        await broadcastNotification(
            ['PARENT'],
            NotificationTemplates.NOTICE_POSTED_PARENT(title)
        );
    }

    revalidatePath(ROUTES.NOTICE_BOARD);
    revalidatePath(ROUTES.TEACHER_NOTICE_BOARD);
    revalidatePath(ROUTES.PARENT_NOTICE_BOARD);

    return { success: true };
}
