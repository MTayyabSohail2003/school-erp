'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/globals';
import {
    LayoutDashboard,
    Users,
    Receipt,
    BookOpen,
    Settings,
    Briefcase,
    GraduationCap,
    ChevronRight,
    CalendarDays,
    ClipboardList,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';

const navGroups = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard, exact: true },
        ],
    },
    {
        label: 'People',
        items: [
            { name: 'Students', href: ROUTES.STUDENTS, icon: Users, exact: false },
            { name: 'Staff & Teachers', href: ROUTES.STAFF, icon: Briefcase, exact: false },
        ],
    },
    {
        label: 'Academics',
        items: [
            { name: 'Attendance', href: ROUTES.ATTENDANCE, icon: CalendarDays, exact: false },
            { name: 'Exams', href: ROUTES.EXAMS, icon: BookOpen, exact: false },
            { name: 'Mark Sheet', href: ROUTES.MARKS, icon: ClipboardList, exact: false },
        ],
    },
    {
        label: 'Finance',
        items: [
            { name: 'Fee Management', href: ROUTES.FEES, icon: Receipt, exact: false },
        ],
    },
    {
        label: 'Config',
        items: [
            { name: 'Class Settings', href: ROUTES.SETTINGS_CLASSES, icon: Settings, exact: false },
        ],
    },
];

export default function AppSidebar() {
    const pathname = usePathname();
    const { open } = useSidebar();

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : (pathname === href || pathname.startsWith(`${href}/`));

    return (
        <Sidebar
            collapsible="icon"
            className="border-r-0 bg-sidebar shadow-xl"
        >
            {/* ── Logo / Brand ── */}
            <SidebarHeader className="h-20 px-4 border-b border-sidebar-border flex flex-row items-center">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Logo mark — always visible */}
                    <div className={cn(
                        'flex shrink-0 items-center justify-center transition-all duration-300',
                        open ? 'h-14 w-14 ml-0' : 'h-10 w-10 mx-auto'
                    )}>
                        <img
                            src="/logo.png"
                            alt="School ERP Logo"
                            width={open ? 60 : 40}
                            height={open ? 60 : 40}
                            className="object-contain"
                        />
                    </div>

                    {/* Brand name — hidden when collapsed */}
                    <div className={cn(
                        'flex flex-col leading-tight overflow-hidden transition-all duration-300',
                        open ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                    )}>
                        <span className="font-bold text-sm text-sidebar-foreground whitespace-nowrap tracking-wide">
                            School ERP
                        </span>
                        <span className="text-[10px] text-primary font-semibold tracking-widest uppercase">
                            Admin Portal
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            {/* ── Navigation ── */}
            <SidebarContent className="py-3 overflow-y-auto">
                {navGroups.map((group) => (
                    <SidebarGroup key={group.label} className="px-3 mb-1">
                        {/* Group label — only shown when expanded */}
                        {open && (
                            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/55 px-1 mb-1.5 font-semibold">
                                {group.label}
                            </SidebarGroupLabel>
                        )}
                        {!open && <div className="h-3" />}

                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1.5">
                                {group.items.map((item) => {
                                    const active = isActive(item.href, item.exact);
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                tooltip={!open ? item.name : undefined}
                                                className={cn(
                                                    'relative w-full rounded-lg transition-all duration-200 h-10',
                                                    'group/item',
                                                    active
                                                        ? 'bg-primary text-primary-foreground font-semibold'
                                                        : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                                )}
                                                style={active ? {
                                                    boxShadow: '0 2px 12px oklch(0.68 0.2 160 / 40%)'
                                                } : undefined}
                                            >
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        'flex items-center gap-3 px-3 w-full h-full',
                                                        !open && 'justify-center px-0'
                                                    )}
                                                >
                                                    <item.icon className={cn(
                                                        'shrink-0 transition-transform duration-200',
                                                        active
                                                            ? 'h-[18px] w-[18px]'
                                                            : 'h-[18px] w-[18px] group-hover/item:scale-110',
                                                    )} />
                                                    {open && (
                                                        <span className="text-sm truncate flex-1">{item.name}</span>
                                                    )}
                                                    {open && active && (
                                                        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-70" />
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            {/* ── Footer ── */}
            <SidebarFooter className="border-t border-sidebar-border p-3">
                <div className={cn(
                    'flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/50',
                    !open && 'justify-center'
                )}>
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    {open && (
                        <span className="text-xs text-sidebar-foreground/60 truncate">
                            Powered by Next.js
                        </span>
                    )}
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
