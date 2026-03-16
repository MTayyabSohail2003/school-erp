'use client';

import { useAdminDashboardStats } from '../api/use-dashboard-stats';
import { DashboardCharts } from './dashboard-charts';
import { StaggerList, StaggerItem } from '@/components/ui/motion';
import {
    Users, Briefcase, TrendingUp, AlertTriangle,
    Activity, ChevronRight, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/globals';
import { format } from 'date-fns';

// ── Premium KPI Card ────────────────────────────────────────────────────────

type KpiCardProps = {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    gradient: string;   // e.g. 'from-blue-600 to-indigo-600'
    glow: string;       // e.g. 'shadow-blue-500/25'
    trend?: string;
    trendUp?: boolean;
};

function KpiCard({ title, value, subtitle, icon: Icon, gradient, glow, trend, trendUp = true }: KpiCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="h-full"
        >
            <div className={`relative h-full rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-xl ${glow} overflow-hidden`}>
                {/* Decorative circles */}
                <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-white/10" />
                <div className="absolute -right-2 bottom-4 h-16 w-16 rounded-full bg-white/5" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        {trend && (
                            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-white/20' : 'bg-black/20'}`}>
                                <span className={`text-[10px] ${!trendUp ? 'rotate-90' : ''}`}>{trendUp ? '↗' : '↘'}</span>
                                {trend}
                            </span>
                        )}
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mt-auto">{title}</p>
                    <p className="text-4xl font-black tracking-tight mt-0.5">{value}</p>
                    <p className="text-xs text-white/65 mt-1">{subtitle}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ── Alert / Action Banner ───────────────────────────────────────────────────

type AlertBannerProps = {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle: string;
    href?: string;
    palette: { bg: string; border: string; icon: string; badge: string; text: string };
};

function AlertBanner({ icon: Icon, title, value, subtitle, href, palette }: AlertBannerProps) {
    return (
        <motion.div whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
            <div className={`relative rounded-2xl border-2 ${palette.border} ${palette.bg} p-5 overflow-hidden`}>
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20" style={{ background: palette.icon }} />
                <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${palette.badge}`}>
                        <Icon className={`h-6 w-6 ${palette.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
                        <p className={`text-3xl font-black tracking-tight mt-0.5 ${palette.text}`}>{value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    </div>
                    {href && (
                        <a href={href} className={`flex items-center gap-1 text-xs font-semibold ${palette.text} shrink-0 mt-1 hover:underline`}>
                            View <ChevronRight className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ── Quick Access Card ───────────────────────────────────────────────────────


export function AdminDashboard({ profile }: { profile: { full_name?: string; role?: string } }) {
    const { data: stats, isLoading } = useAdminDashboardStats();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || 'Admin';
    const today = new Date();

    return (
        <div className="space-y-8">
            {/* ── Hero Banner ── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative rounded-3xl overflow-hidden px-7 py-8 text-white shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 45%, #059669 100%)' }}
            >
                {/* Animated background blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
                    <div className="absolute -left-10 -bottom-20 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />
                    <div className="absolute right-1/3 top-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-medium text-white/60 uppercase tracking-widest">Admin Portal</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            {greeting}, {firstName}! 👋
                        </h1>
                        <p className="text-sm text-white/60 mt-1.5">{format(today, 'EEEE, MMMM dd, yyyy')}</p>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {!isLoading && (
                                <>
                                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
                                        👥 {stats?.studentCount ?? 0} Students
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
                                        📊 {stats?.attendance.rate ?? 0}% Attendance Today
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/20 rounded-full px-3 py-1.5 text-xs font-semibold text-emerald-200">
                                        <Zap className="h-3 w-3" /> Live Data
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Revenue pill highlight */}
                    {!isLoading && (
                        <div className="flex flex-col sm:flex-row gap-3 overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 shrink-0 text-center"
                            >
                                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Fee Collection</p>
                                <p className="text-2xl font-black">
                                    {stats?.financials.currentMonthPaidCount ?? 0}
                                    <span className="text-sm font-normal text-white/40 mx-1">/</span>
                                    {(stats?.financials.currentMonthPaidCount ?? 0) + (stats?.financials.currentMonthPendingCount ?? 0)}
                                </p>
                                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-tight mt-1">Students Paid</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 shrink-0 text-center"
                            >
                                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Collected</p>
                                <p className="text-2xl font-black">Rs. {(stats?.financials.currentMonthCollected ?? 0).toLocaleString()}</p>
                                <p className="text-xs text-yellow-300 mt-1">Pending: Rs. {(stats?.financials.currentMonthPending ?? 0).toLocaleString()}</p>
                            </motion.div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Core KPIs ── */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Core Operations</h2>
                </div>
                <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StaggerItem>
                        <KpiCard
                            title="Total Students"
                            value={isLoading ? '—' : stats?.studentCount ?? 0}
                            subtitle="Active enrollments"
                            icon={Users}
                            gradient="from-blue-600 to-indigo-700"
                            glow="shadow-xl shadow-blue-500/30"
                            trend="Active"
                        />
                    </StaggerItem>
                    <StaggerItem>
                        <KpiCard
                            title="Teaching Staff"
                            value={isLoading ? '—' : stats?.teacherCount ?? 0}
                            subtitle="Registered teachers"
                            icon={Briefcase}
                            gradient="from-amber-500 to-orange-600"
                            glow="shadow-xl shadow-amber-500/30"
                        />
                    </StaggerItem>
                    <StaggerItem>
                        <KpiCard
                            title="Attendance Rate"
                            value={isLoading ? '—' : `${stats?.attendance.rate ?? 0}%`}
                            subtitle={`${stats?.attendance.present ?? 0} present · ${stats?.attendance.absent ?? 0} absent`}
                            icon={Activity}
                            gradient="from-emerald-500 to-teal-600"
                            glow="shadow-xl shadow-emerald-500/30"
                            trend={stats?.attendance.rate && stats.attendance.rate > 90 ? 'Excellent' : 'Monitor'}
                            trendUp={stats?.attendance.rate ? stats.attendance.rate > 90 : true}
                        />
                    </StaggerItem>
                    <StaggerItem>
                        <KpiCard
                            title="Monthly Revenue"
                            value={isLoading ? '—' : `Rs. ${(stats?.financials.currentMonthCollected ?? 0).toLocaleString()}`}
                            subtitle={`${stats?.financials.currentMonthPaidCount ?? 0} of ${(stats?.financials.currentMonthPaidCount ?? 0) + (stats?.financials.currentMonthPendingCount ?? 0)} paid`}
                            icon={TrendingUp}
                            gradient="from-violet-600 to-purple-700"
                            glow="shadow-xl shadow-violet-500/30"
                            trend="This month"
                        />
                    </StaggerItem>
                </StaggerList>
            </div>

            {/* ── Action Required ── */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-1 rounded-full bg-red-500" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Action Required</h2>
                </div>
                <StaggerList className="grid gap-4 sm:grid-cols-2">
                    <StaggerItem>
                        <AlertBanner
                            icon={AlertTriangle}
                            title="Fee Defaulters (All Time)"
                            value={isLoading ? '—' : stats?.financials.totalDefaultersCount ?? 0}
                            subtitle={`Total arrears: Rs. ${(stats?.financials.totalArrears ?? 0).toLocaleString()}`}
                            href={ROUTES.DEFAULTERS}
                            palette={{
                                bg: 'bg-red-500/5',
                                border: 'border-red-500/25',
                                icon: '#ef4444',
                                badge: 'bg-red-500/15',
                                text: 'text-red-500',
                            }}
                        />
                    </StaggerItem>
                    <StaggerItem>
                        <AlertBanner
                            icon={Users}
                            title="Today's Absentees"
                            value={isLoading ? '—' : stats?.attendance.absent ?? 0}
                            subtitle="Students marked absent — SMS alerts suggested"
                            href={ROUTES.ATTENDANCE}
                            palette={{
                                bg: 'bg-orange-500/5',
                                border: 'border-orange-500/25',
                                icon: '#f97316',
                                badge: 'bg-orange-500/15',
                                text: 'text-orange-500',
                            }}
                        />
                    </StaggerItem>
                </StaggerList>
            </div>


            {/* ── Analytics Charts ── */}
            <DashboardCharts />
        </div>
    );
}
