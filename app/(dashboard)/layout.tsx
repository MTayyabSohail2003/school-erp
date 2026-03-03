'use client';

import { useAuthProfile, useLogout } from '@/features/auth/hooks/use-auth';
import { ROUTES } from '@/constants/globals';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { data: profile, isLoading } = useAuthProfile();
    const logoutMutation = useLogout();
    const router = useRouter();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => {
                router.push(ROUTES.LOGIN);
                router.refresh(); // Refresh cookies
            },
        });
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <header className="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="font-semibold text-lg flex items-center gap-2">
                    <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center text-white">E</div>
                    School ERP
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground mr-2">Logged in as:</span>
                        <span className="font-medium">{profile?.full_name || 'User'} ({profile?.role})</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending}>
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 z-0">
                {children}
            </main>
        </div>
    );
}
