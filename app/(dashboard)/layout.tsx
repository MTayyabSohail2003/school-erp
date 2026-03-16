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

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { data: profile, isLoading } = useAuthProfile();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && profile) {
            const role = profile.role;
            const isFinanceRoute = pathname.startsWith('/dashboard/finance') || pathname.startsWith('/dashboard/payroll');
            const isStaffRoute = pathname.startsWith('/dashboard/staff');
            const isConfigRoute = pathname.startsWith('/dashboard/settings');

            if (role === 'TEACHER' && (isFinanceRoute || isStaffRoute || isConfigRoute)) {
                router.replace('/dashboard');
            } else if (role === 'PARENT') {
                // Parents can only view auto challans, mark sheets, attendance, leave requests, their children's profiles & exams.
                const allowedParentRoutes = [
                    '/dashboard/finance/challans',
                    '/dashboard/students',
                    '/dashboard/exams',
                    '/dashboard/marks',
                    '/dashboard/attendance',
                    '/settings/notices' // Assuming notices will be open to parents as well
                ];

                const isAllowed = allowedParentRoutes.some(route => pathname.startsWith(route)) || pathname === '/dashboard';

                if (!isAllowed) {
                    router.replace('/dashboard');
                }
            }
        }
    }, [pathname, profile, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/40">
                <Loader size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    return (
        <SidebarProvider style={{ '--sidebar-width': '240px', '--sidebar-width-icon': '64px' } as React.CSSProperties}>
            <AppSidebar />
            <div className="flex w-full flex-col min-h-screen">
                <Header />
                <AnnouncementBanner />
                <NotificationToastListener />
                <main className="flex-1 p-6 lg:p-8 z-0">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
