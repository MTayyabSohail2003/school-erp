'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthProfile, useUploadAvatar } from '@/features/auth/hooks/use-auth';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/globals';
import { LayoutDashboard, Users, Wallet, Settings, GraduationCap, Banknote, Calendar, BookOpen, ChevronRight, ClipboardList, AlertTriangle, FileText, CalendarDays, Briefcase, User, Loader2 } from 'lucide-react';
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
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export type NavItem = {
    name: string;
    icon: React.ElementType;
    href?: string;
    exact?: boolean;
    roles: string[];
    subItems?: { name: string; href: string; exact?: boolean; roles: string[] }[];
};

export const navGroups: { label: string; items: NavItem[] }[] = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard, exact: true, roles: ['ADMIN', 'TEACHER', 'PARENT'] },
        ],
    },
    {
        label: 'People',
        items: [
            { name: 'Students', href: ROUTES.STUDENTS, icon: Users, exact: false, roles: ['ADMIN', 'TEACHER'] },
            { name: 'Staff & Teachers', href: ROUTES.STAFF, icon: Briefcase, exact: false, roles: ['ADMIN'] },
            { name: 'Parents', href: '/dashboard/parents', icon: User, exact: false, roles: ['ADMIN'] },
        ],
    },
    {
        label: 'Academics',
        items: [
            { name: 'Attendance', href: ROUTES.ATTENDANCE, icon: CalendarDays, exact: false, roles: ['ADMIN', 'TEACHER', 'PARENT'] },
            { name: 'Leave Requests', href: '/dashboard/attendance/leaves', icon: ClipboardList, exact: false, roles: ['ADMIN', 'TEACHER', 'PARENT'] },
            { name: 'Exams', href: ROUTES.EXAMS, icon: BookOpen, exact: false, roles: ['ADMIN', 'TEACHER'] },
            { name: 'Mark Sheet', href: ROUTES.MARKS, icon: ClipboardList, exact: false, roles: ['ADMIN', 'TEACHER', 'PARENT'] },
            { name: 'Subjects', href: '/academics', icon: BookOpen, exact: false, roles: ['ADMIN'] },
        ],
    },
    {
        label: 'Timetable',
        items: [
            { name: 'Master Schedule', href: '/timetable', icon: Calendar, exact: false, roles: ['ADMIN'] },
        ],
    },
    {
        label: 'Finance',
        items: [
            { name: 'Fee Structures', href: ROUTES.FEE_STRUCTURES, icon: Banknote, exact: false, roles: ['ADMIN'] },
            { name: 'Auto Challans', href: ROUTES.CHALLANS, icon: FileText, exact: false, roles: ['ADMIN', 'PARENT'] },
            { name: 'Defaulters', href: ROUTES.DEFAULTERS, icon: AlertTriangle, exact: false, roles: ['ADMIN'] },
            { name: 'Staff Payroll', href: ROUTES.PAYROLL, icon: Wallet, exact: false, roles: ['ADMIN'] },
        ],
    },
    {
        label: 'Settings',
        items: [
            {
                name: 'Settings',
                icon: Settings,
                roles: ['ADMIN', 'TEACHER', 'PARENT'],
                subItems: [
                    { name: 'Add Classes', href: ROUTES.SETTINGS_CLASSES, exact: false, roles: ['ADMIN'] },
                    { name: 'Notice Board', href: ROUTES.NOTICE_BOARD, exact: false, roles: ['ADMIN', 'TEACHER', 'PARENT'] },
                ],
            },
        ],
    },
];

export default function AppSidebar() {
    const pathname = usePathname();
    const { open } = useSidebar();
    const { data: profile } = useAuthProfile();
    const uploadAvatarMutation = useUploadAvatar();

    const onDrop = async (acceptedFiles: File[]) => {
        if (!profile?.id) return;

        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be less than 2MB");
            return;
        }

        uploadAvatarMutation.mutate(
            { userId: profile.id, file },
            {
                onSuccess: () => {
                    toast.success('Profile picture updated!');
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to upload image');
                }
            }
        );
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': []
        },
        maxFiles: 1,
        disabled: uploadAvatarMutation.isPending
    });

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : (pathname === href || pathname.startsWith(`${href}/`));

    return (
        <Sidebar
            collapsible="icon"
            className="border-r-0 bg-sidebar shadow-xl"
        >
            {/* ── Logo / Brand with SVG Cutout ── */}
            <SidebarHeader className={cn(
                "relative flex flex-col items-center justify-start transition-all duration-300",
                "bg-sidebar text-sidebar-foreground border-none rounded-none shadow-none p-0 mb-8",
                open ? 'h-[120px]' : 'h-[80px]'
            )}>
                {/* 1. Header Background & Brand Text Space */}
                <div className="w-full h-[80px] relative z-10 flex flex-col items-center justify-center pt-2">
                    <div className={cn(
                        'flex flex-col items-center justify-center leading-tight overflow-hidden transition-all duration-300',
                        open ? 'opacity-100 h-auto translate-y-0' : 'opacity-0 h-0 -translate-y-4 hidden'
                    )}>
                        <span className="font-bold text-xl text-sidebar-foreground whitespace-nowrap tracking-wide">
                            School ERP
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mt-0.5">
                            Admin Portal
                        </span>
                    </div>
                </div>

                {/* 2. The SVG Curved Line (Only visible when expanded for best effect, or scales down) */}
                <div className="absolute top-[80px] left-0 w-full h-[40px] z-0 overflow-hidden">
                    {open ? (
                        <svg viewBox="0 0 250 40" preserveAspectRatio="none" className="w-full h-full text-border/40" style={{ strokeWidth: 2 }}>
                            {/* Draws the horizontal line that dips into a U-shape in the middle */}
                            <path
                                d="M 0 0 L 85 0 C 95 0 95 40 125 40 C 155 40 155 0 165 0 L 250 0"
                                fill="none"
                                stroke="currentColor"
                            />
                        </svg>
                    ) : (
                        <div className="w-full h-px bg-border/40" />
                    )}
                </div>

                {/* 3. Overlapping Avatar Bump with Dropzone */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center",
                        "transition-all duration-300 cursor-pointer group",
                        open ? "top-[50px] w-[86px] h-[86px]" : "top-[55px] w-[45px] h-[45px]",
                        // Using a semi-transparent primary color for the outer ring
                        open ? "bg-primary/10 rounded-full" : "bg-transparent",
                        isDragActive && "ring-4 ring-primary/50"
                    )}
                    title="Click to change profile picture"
                >
                    <input {...getInputProps()} />
                    <div className={cn(
                        "bg-sidebar rounded-full flex items-center justify-center shadow-sm relative overflow-hidden transition-all",
                        open ? "w-[64px] h-[64px] group-hover:ring-2 ring-white/50" : "w-[40px] h-[40px] border border-border"
                    )}>
                        {uploadAvatarMutation.isPending ? (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10 transition-opacity">
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 z-10 transition-opacity">
                                <span className={cn("font-bold text-white uppercase tracking-wider text-center leading-tight", open ? "text-[10px]" : "text-[8px]")}>Change</span>
                            </div>
                        )}

                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/20">
                                <User className={cn("text-primary", open ? "w-7 h-7" : "w-5 h-5")} fill="currentColor" strokeWidth={1} />
                            </div>
                        )}
                    </div>
                </div>
            </SidebarHeader>

            {/* ── Navigation ── */}
            <SidebarContent className="pt-12 pb-3 overflow-y-auto">
                {navGroups.map((group) => {
                    // Filter items based on role
                    const filteredItems = group.items.filter(item =>
                        !profile || item.roles.includes(profile.role)
                    );

                    if (filteredItems.length === 0) return null;

                    return (
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
                                    {filteredItems.map((item) => {
                                        const itemIsActive = item.href ? isActive(item.href, item.exact || false) : item.subItems?.some(sub => isActive(sub.href, sub.exact || false));

                                        if (item.subItems) {
                                            const filteredSubItems = item.subItems.filter(sub => !profile || sub.roles.includes(profile.role));
                                            if (filteredSubItems.length === 0) return null;

                                            return (
                                                <Collapsible
                                                    key={item.name}
                                                    asChild
                                                    defaultOpen={itemIsActive}
                                                    className="group/collapsible"
                                                >
                                                    <SidebarMenuItem>
                                                        <CollapsibleTrigger asChild>
                                                            <SidebarMenuButton
                                                                tooltip={!open ? item.name : undefined}
                                                                className={cn(
                                                                    'relative w-full rounded-lg transition-all duration-200 h-10',
                                                                    itemIsActive ? 'text-primary font-semibold' : 'text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                                                )}
                                                            >
                                                                <item.icon className="shrink-0 h-[18px] w-[18px]" />
                                                                {open && <span className="text-sm truncate flex-1">{item.name}</span>}
                                                                {open && (
                                                                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-70" />
                                                                )}
                                                            </SidebarMenuButton>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <SidebarMenuSub>
                                                                {filteredSubItems.map((sub) => {
                                                                    const subActive = isActive(sub.href, sub.exact || false);
                                                                    return (
                                                                        <SidebarMenuSubItem key={sub.href}>
                                                                            <SidebarMenuSubButton
                                                                                asChild
                                                                                isActive={subActive}
                                                                                className={cn(
                                                                                    'transition-all duration-200',
                                                                                    subActive ? 'text-primary font-semibold' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                                                                                )}
                                                                            >
                                                                                <Link href={sub.href}>
                                                                                    <span>{sub.name}</span>
                                                                                </Link>
                                                                            </SidebarMenuSubButton>
                                                                        </SidebarMenuSubItem>
                                                                    );
                                                                })}
                                                            </SidebarMenuSub>
                                                        </CollapsibleContent>
                                                    </SidebarMenuItem>
                                                </Collapsible>
                                            );
                                        }

                                        const active = isActive(item.href!, item.exact || false);
                                        return (
                                            <SidebarMenuItem key={item.href || item.name}>
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
                                                        href={item.href!}
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
                    )
                })}
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
