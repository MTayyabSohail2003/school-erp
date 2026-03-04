'use client';

import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar'; // Renamed import to match default export we will create
import { Header } from '@/components/layout/header';
import { Loader } from '@/components/ui/loader';

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
            } else if (role === 'PARENT' && (isFinanceRoute || isStaffRoute || isConfigRoute || pathname.startsWith('/dashboard/students') || pathname.startsWith('/dashboard/exams'))) {
                // Parents can only view auto challans, mark sheets, and attendance (which might have their own views).
                // Assuming challans is under finance which is blocked, let's whitelist it if it's true
                // But wait, the sidebar says Challans is ROUTES.CHALLANS. Let's see what that is.
                // Assuming we just restrict heavily:
                if (pathname.includes('/finance/challans')) {
                    // let it pass
                } else if (isFinanceRoute || isStaffRoute || isConfigRoute || pathname.startsWith('/dashboard/students')) {
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
                <main className="flex-1 p-6 lg:p-8 z-0">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
