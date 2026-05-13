'use client';

import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loader } from '@/components/ui/loader';
import { AnnouncementBanner } from '@/features/notices/components/announcement-banner';
import { NotificationToastListener } from '@/features/notifications/components/notification-toast-listener';
import { ROUTES } from '@/constants/globals';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { data: profile, isLoading, isError, error, refetch } = useAuthProfile();
    const pathname = usePathname();
    const router = useRouter();

    // Only redirect to login if there is genuinely no Supabase session
    useEffect(() => {
        if (!isLoading && isError && error?.message === 'Not authenticated') {
            router.replace('/login');
        }
    }, [isLoading, isError, error, router]);

    // Role-based route protection
    useEffect(() => {
        if (!isLoading && profile) {
            const role = profile.role;
            const isFinanceRoute = pathname.startsWith('/dashboard/finance') || pathname.startsWith('/dashboard/payroll');
            const isStaffRoute = pathname.startsWith('/dashboard/staff');
            const isConfigRoute = pathname.startsWith('/dashboard/settings');

            if (role === 'TEACHER' && (isFinanceRoute || isStaffRoute || isConfigRoute)) {
                router.replace('/dashboard');
            } else if (role === 'PARENT') {
                const allowedParentRoutes = [
                    '/dashboard/finance/challans',
                    ROUTES.STUDENTS,
                    ROUTES.EXAMS,
                    ROUTES.MARKS,
                    ROUTES.ATTENDANCE,
                    ROUTES.PARENT_NOTICE_BOARD,
                ];
                const isAllowed =
                    allowedParentRoutes.some(route => pathname.startsWith(route)) ||
                    pathname === ROUTES.DASHBOARD;
                if (!isAllowed) router.replace(ROUTES.DASHBOARD);
            }
        }
    }, [pathname, profile, isLoading, router]);

    // Show spinner while profile is being fetched
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/40">
                <Loader size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    // If profile failed (RLS / network) show a retry screen — don't loop forever
    if (isError && error?.message !== 'Not authenticated') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/40 text-center px-4">
                <p className="text-lg font-bold text-destructive">Could not load profile</p>
                <p className="text-sm text-muted-foreground max-w-sm">{error?.message}</p>
                <button
                    onClick={() => refetch()}
                    className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <SidebarProvider style={{ '--sidebar-width': '240px', '--sidebar-width-icon': '64px' } as React.CSSProperties}>
            <AppSidebar />
            <div className="flex w-full min-w-0 flex-col min-h-screen print:hidden">
                <Header />
                <AnnouncementBanner />
                <NotificationToastListener />
                <main className="flex-1 min-w-0 p-6 lg:p-8 z-0">
                    <div className="w-full h-full">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
