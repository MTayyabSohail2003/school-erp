'use client';

import { useAuthProfile, useLogout } from '@/features/auth/hooks/use-auth';
import { ROUTES } from '@/constants/globals';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, Bell } from 'lucide-react';

export function Header() {
    const { data: profile } = useAuthProfile();
    const logoutMutation = useLogout();
    const router = useRouter();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => {
                router.push(ROUTES.LOGIN);
                router.refresh();
            },
        });
    };

    const initials = profile?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <header className="sticky top-0 z-10 flex h-20 w-full items-center justify-between border-b border-border/50 bg-white dark:bg-sidebar backdrop-blur-xl px-4 md:px-6 gap-4">
            {/* Left — sidebar toggle */}
            <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200" />

                {/* Breadcrumb / page context */}
                <div className="hidden sm:flex items-center">
                    <span className="text-sm font-medium text-muted-foreground">School ERP</span>
                </div>
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-2">
                {/* Notifications icon */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary shadow-sm" />
                </Button>

                <ThemeToggle />

                {/* Divider */}
                <div className="h-6 w-px bg-border mx-1" />

                {/* User badge */}
                <div className="flex items-center gap-2.5">
                    {/* Avatar */}
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
                        style={{ boxShadow: '0 2px 10px oklch(0.68 0.2 160 / 40%)' }}
                    >
                        {initials}
                    </div>

                    {/* Name + role — hidden on mobile */}
                    <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                            {profile?.full_name || 'User'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {profile?.role}
                        </span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="h-9 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg ml-1"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">Logout</span>
                </Button>
            </div>
        </header>
    );
}
