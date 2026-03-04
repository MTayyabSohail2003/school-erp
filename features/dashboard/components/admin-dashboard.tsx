'use client';

import { useAdminDashboardStats } from '../api/use-dashboard-stats';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StaggerList, StaggerItem } from '@/components/ui/motion';
import { Users, Briefcase, TrendingUp, AlertTriangle, ArrowUpRight, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/globals';
import { format } from 'date-fns';

type StatCardProps = {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    highlight?: boolean;
    iconBg: string;
    iconColor: string;
    trend?: string;
    trendColor?: string;
};

function StatCard({ title, value, subtitle, icon: Icon, highlight, iconBg, iconColor, trend, trendColor = "text-emerald-500" }: StatCardProps) {
    return (
        <motion.div whileHover={{ y: -3, scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
            <Card className={`relative overflow-hidden border transition-shadow duration-300 ${highlight
                ? 'bg-primary border-primary/50 text-primary-foreground shadow-lg'
                : 'bg-card border-border hover:shadow-md'
                }`}
            >
                {highlight && (
                    <>
                        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                        <div className="absolute -right-2 bottom-0 h-16 w-16 rounded-full bg-white/8" />
                    </>
                )}

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${highlight ? 'bg-white/20 text-white' : `${iconBg} ${iconColor}`}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-1">
                    <div className={`text-3xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-foreground'}`}>
                        {value}
                    </div>
                    <p className={`text-xs mt-1.5 ${highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {subtitle}
                    </p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2.5">
                            <div className={`flex items-center gap-1 text-xs font-medium ${highlight ? 'text-white/90' : trendColor}`}>
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

export function AdminDashboard({ profile }: { profile: any }) {
    const { data: stats, isLoading } = useAdminDashboardStats();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    const today = new Date();

    return (
        <div className="space-y-7">
            {/* ── Greeting ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {greeting}, {firstName}! 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Here&apos;s the latest overview of school operations for {format(today, 'MMM dd, yyyy')}.
                    </p>
                </div>
            </div>

            {/* ── Core KPIs ── */}
            <h2 className="text-base font-semibold mb-2 text-foreground">Core Operations</h2>
            <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StaggerItem>
                    <StatCard
                        title="Total Students"
                        value={isLoading ? '...' : stats?.studentCount ?? 0}
                        subtitle="Actively enrolled"
                        icon={Users}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-500"
                    />
                </StaggerItem>

                <StaggerItem>
                    <StatCard
                        title="Teaching Staff"
                        value={isLoading ? '...' : stats?.teacherCount ?? 0}
                        subtitle="Registered teachers"
                        icon={Briefcase}
                        iconBg="bg-amber-500/10"
                        iconColor="text-amber-500"
                    />
                </StaggerItem>

                <StaggerItem>
                    <StatCard
                        title="Today's Attendance"
                        value={isLoading ? '...' : `${stats?.attendance.rate}%`}
                        subtitle={`${stats?.attendance.present} present, ${stats?.attendance.absent} absent`}
                        icon={Activity}
                        highlight
                        iconBg=""
                        iconColor=""
                        trend={stats?.attendance.rate && stats.attendance.rate > 90 ? "Excellent turnout" : "Needs attention"}
                    />
                </StaggerItem>

                <StaggerItem>
                    <StatCard
                        title="Monthly Revenue"
                        value={isLoading ? '...' : `Rs. ${stats?.financials.currentMonthCollected.toLocaleString()}`}
                        subtitle={`Pending: Rs. ${stats?.financials.currentMonthPending.toLocaleString()}`}
                        icon={TrendingUp}
                        iconBg="bg-emerald-500/10"
                        iconColor="text-emerald-500"
                    />
                </StaggerItem>
            </StaggerList>

            {/* ── Action Required KPIs ── */}
            <h2 className="text-base font-semibold mb-2 mt-8 text-foreground">Action Required</h2>
            <StaggerList className="grid gap-4 sm:grid-cols-2">
                <StaggerItem>
                    <StatCard
                        title="Defaulters (All Time)"
                        value={isLoading ? '...' : stats?.financials.totalDefaultersCount ?? 0}
                        subtitle={`Total Arrears: Rs. ${stats?.financials.totalArrears.toLocaleString()}`}
                        icon={AlertTriangle}
                        iconBg="bg-red-500/10"
                        iconColor="text-red-500"
                        trendColor="text-red-500"
                        trend="Follow up required"
                    />
                </StaggerItem>
                <StaggerItem>
                    <StatCard
                        title="Today's Absentees"
                        value={isLoading ? '...' : stats?.attendance.absent ?? 0}
                        subtitle="Students marked absent today"
                        icon={Users}
                        iconBg="bg-orange-500/10"
                        iconColor="text-orange-500"
                        trendColor="text-orange-500"
                        trend="SMS triggers suggested"
                    />
                </StaggerItem>
            </StaggerList>

            {/* ── Quick Access ── */}
            <div>
                <h2 className="text-base font-semibold mb-4 mt-8 text-foreground">Quick Access</h2>
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
                            label: 'Fee Challans',
                            href: ROUTES.CHALLANS,
                            description: 'Generate or collect fee slips',
                            from: 'from-emerald-500/20',
                            to: 'to-emerald-500/5',
                            border: 'border-emerald-500/20',
                            icon: DollarSign,
                            iconClass: 'text-emerald-500',
                        },
                        {
                            label: 'Defaulters List',
                            href: ROUTES.DEFAULTERS,
                            description: 'Follow up on unpaid fees',
                            from: 'from-red-500/20',
                            to: 'to-red-500/5',
                            border: 'border-red-500/20',
                            icon: AlertTriangle,
                            iconClass: 'text-red-500',
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
    );
}
