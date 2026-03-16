'use client';

import { useLogout, useAuthProfile } from '@/features/auth/hooks/use-auth';
import { ROUTES } from '@/constants/globals';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { navGroups } from '@/components/layout/sidebar';
import { Input } from '@/components/ui/input';
import { Search, User, MoreHorizontal, Grid3x3, LogOut, LucideIcon } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

export function Header() {
    const logoutMutation = useLogout();
    const router = useRouter();
    const pathname = usePathname();
    const { data: profile } = useAuthProfile();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => {
                router.push(ROUTES.LOGIN);
                router.refresh();
            },
        });
    };

    // Format breadcrumbs: HOME / DASHBOARD
    const pathSegments = pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || 'Dashboard';
    const breadcrumbText = lastSegment.toUpperCase().replace(/-/g, ' ');

    // Find the current page icon from navGroups
    let ActiveIcon: LucideIcon | null = null;
    for (const group of navGroups) {
        for (const item of group.items) {
            if (item.subItems) {
                for (const subItem of item.subItems) {
                    const isExact = subItem.exact;
                    if (isExact ? pathname === subItem.href : (pathname === subItem.href || pathname.startsWith(`${subItem.href}/`))) {
                        ActiveIcon = item.icon as LucideIcon;
                        break;
                    }
                }
            } else if (item.href) {
                const isExact = item.exact;
                if (isExact ? pathname === item.href : (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
                    ActiveIcon = item.icon as LucideIcon;
                    break;
                }
            }
            if (ActiveIcon) break;
        }
        if (ActiveIcon) break;
    }

    return (
        <header className="sticky top-0 z-10 flex h-20 w-full items-center justify-between bg-sidebar px-4 md:px-6 gap-4 shadow-sm min-h-[5rem] transition-colors duration-300">
            {/* Left — sidebar toggle & breadcrumbs */}
            <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200" />

                <div className="hidden sm:flex items-center text-sm font-bold tracking-wider">
                    {ActiveIcon && <ActiveIcon className="h-5 w-5 text-primary mr-3" />}
                    <span className="text-primary mr-2 uppercase">Home</span>
                    <span className="text-muted-foreground mr-2">/</span>
                    <span className="text-muted-foreground uppercase">{breadcrumbText}</span>
                </div>
            </div>

            {/* Center - Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 hidden md:flex items-center">
                <div className="relative w-full group">
                    <Input
                        placeholder="Search..."
                        className="w-full h-10 pl-5 pr-10 rounded-full bg-accent/50 text-foreground border-transparent focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 shadow-sm font-medium"
                    />
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
            </div>

            {/* Right — actions & profile */}
            <div className="flex items-center gap-3 sm:gap-5">

                <div className="hidden lg:flex items-center gap-2">
                    {/* Role-based Icon: Admin gets Grid, others get WhatsApp */}
                    {profile?.role === 'ADMIN' ? (
                        <Button variant="ghost" size="icon" className="h-[38px] w-[38px] rounded-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                            <Grid3x3 className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" className="h-[38px] w-[38px] rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-950/30" asChild title="Contact Support on WhatsApp">
                            <a href="https://wa.me/923000000000" target="_blank" rel="noopener noreferrer">
                                <FaWhatsapp className="h-[22px] w-[22px]" />
                            </a>
                        </Button>
                    )}
                </div>

                <ThemeToggle />

                {/* Notifications bell — live from Supabase */}
                <NotificationBell />

                {/* Vertical Divider */}
                <div className="h-8 w-px bg-border/50 hidden sm:block mx-1"></div>

                {/* User Profile Block */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center shadow-inner">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="User Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div className="hidden md:flex flex-col items-start leading-none justify-center">
                        <span className="text-sm font-semibold text-sidebar-foreground">{profile?.full_name || 'User'}</span>
                        <span className="text-xs font-medium text-muted-foreground capitalize mt-1.5">{profile?.role?.toLowerCase() || 'Admin'}</span>
                    </div>

                    {/* Options / Logout Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 ml-1 rounded-full text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-sidebar text-sidebar-foreground border border-border shadow-lg">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout} disabled={logoutMutation.isPending}>
                                <LogOut className="mr-2 h-4 w-4 text-destructive" />
                                <span className={logoutMutation.isPending ? "opacity-50" : "text-destructive"}>
                                    {logoutMutation.isPending ? "Logging out..." : "Log out"}
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
