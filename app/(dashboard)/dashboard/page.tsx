'use client';

import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useStudents } from '@/features/students/hooks/use-students';
import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { Users, Briefcase, BookOpen, TrendingUp, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/globals';

type StatCardProps = {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    highlight?: boolean; // if true, renders the filled green card like in reference
    iconBg: string;
    iconColor: string;
    trend?: string;
};

function StatCard({ title, value, subtitle, icon: Icon, highlight, iconBg, iconColor, trend }: StatCardProps) {
    return (
        <motion.div whileHover={{ y: -3, scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
            <Card className={`relative overflow-hidden border transition-shadow duration-300 ${highlight
                ? 'bg-primary border-primary/50 text-primary-foreground shadow-lg'
                : 'bg-card border-border hover:shadow-md'
                }`}
                style={highlight ? { boxShadow: '0 8px 28px oklch(0.68 0.2 160 / 35%)' } : undefined}
            >
                {/* Decorative circle for highlight card */}
                {highlight && (
                    <>
                        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                        <div className="absolute -right-2 bottom-0 h-16 w-16 rounded-full bg-white/8" />
                    </>
                )}

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
                    <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                        highlight ? 'bg-white/20 text-white' : `${iconBg} ${iconColor}`
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-white/80' : 'text-muted-foreground'
                        }`}>
                        {title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-1">
                    <motion.div
                        key={String(value)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`text-3xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-foreground'}`}
                    >
                        {value}
                    </motion.div>
                    <p className={`text-xs mt-1.5 ${highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {subtitle}
                    </p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2.5">
                            <div className={`flex items-center gap-1 text-xs font-medium ${highlight ? 'text-white/90' : 'text-emerald-500 dark:text-emerald-400'
                                }`}>
                                <ArrowUpRight className="h-3 w-3" />
                                {trend}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// cn helper inline
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function DashboardPage() {
    const { data: profile } = useAuthProfile();
    const { data: students } = useStudents();
    const { data: staff } = useGetStaff();
    const { data: classes } = useClasses();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || 'there';

    return (
        <PageTransition>
            <div className="space-y-7">
                {/* ── Greeting ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {greeting}, {firstName}! 👋
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Here&apos;s what&apos;s happening in your school today.
                        </p>
                    </div>
                </div>

                {/* ── Stat Cards (reference-style) ── */}
                <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StaggerItem>
                        <StatCard
                            title="Total Students"
                            value={students?.length ?? '—'}
                            subtitle="Enrolled this session"
                            icon={Users}
                            iconBg="bg-primary/10"
                            iconColor="text-primary"
                            trend="Active enrolments"
                        />
                    </StaggerItem>

                    {/* ── Highlighted card = Primary green filled (like the reference) ── */}
                    <StaggerItem>
                        <StatCard
                            title="Teaching Staff"
                            value={staff?.length ?? '—'}
                            subtitle="Registered teachers"
                            icon={Briefcase}
                            highlight
                            iconBg=""
                            iconColor=""
                        />
                    </StaggerItem>

                    <StaggerItem>
                        <StatCard
                            title="Classes"
                            value={classes?.length ?? '—'}
                            subtitle="Active class sections"
                            icon={BookOpen}
                            iconBg="bg-blue-500/10"
                            iconColor="text-blue-500 dark:text-blue-400"
                        />
                    </StaggerItem>

                    <StaggerItem>
                        <StatCard
                            title="Phase Progress"
                            value="2 / 5"
                            subtitle="Phases completed"
                            icon={TrendingUp}
                            iconBg="bg-amber-500/10"
                            iconColor="text-amber-500 dark:text-amber-400"
                            trend="Phase 3 starting soon"
                        />
                    </StaggerItem>
                </StaggerList>

                {/* ── Quick Access ── */}
                <div>
                    <h2 className="text-base font-semibold mb-4 text-foreground">Quick Access</h2>
                    <StaggerList className="grid gap-4 sm:grid-cols-3">
                        {[
                            {
                                label: 'Manage Students',
                                href: ROUTES.STUDENTS,
                                description: 'View, add, and edit student records',
                                from: 'from-primary/20',
                                to: 'to-primary/5',
                                border: 'border-primary/20',
                                icon: Users,
                                iconClass: 'text-primary',
                            },
                            {
                                label: 'Staff & Teachers',
                                href: ROUTES.STAFF,
                                description: 'Manage teacher profiles and salaries',
                                from: 'from-blue-500/20',
                                to: 'to-blue-500/5',
                                border: 'border-blue-500/20',
                                icon: Briefcase,
                                iconClass: 'text-blue-500 dark:text-blue-400',
                            },
                            {
                                label: 'Class Settings',
                                href: ROUTES.SETTINGS_CLASSES,
                                description: 'Configure classes and sections',
                                from: 'from-amber-500/20',
                                to: 'to-amber-500/5',
                                border: 'border-amber-500/20',
                                icon: BookOpen,
                                iconClass: 'text-amber-500 dark:text-amber-400',
                            },
                        ].map((item) => (
                            <StaggerItem key={item.href}>
                                <motion.a
                                    href={item.href}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                    className={`flex items-center gap-4 rounded-xl bg-gradient-to-br ${item.from} ${item.to} border ${item.border} p-4 cursor-pointer group`}
                                >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/50 ${item.iconClass}`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {item.description}
                                        </p>
                                    </div>
                                    <ArrowUpRight className={`ml-auto h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${item.iconClass}`} />
                                </motion.a>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                </div>
            </div>
        </PageTransition>
    );
}


