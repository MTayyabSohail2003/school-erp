'use client';

import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar'; // Renamed import to match default export we will create
import { Header } from '@/components/layout/header';
import { Loader } from '@/components/ui/loader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { isLoading } = useAuthProfile();

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
