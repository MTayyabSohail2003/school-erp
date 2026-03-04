'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useChartStats } from '../api/use-chart-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart2, PieChart as PieIcon, Activity, BookOpen } from 'lucide-react';

// ── Shared style constants ─────────────────────────────────────────────────

const GRID_COLOR = 'rgba(128,128,128,0.2)';       // visible in both light + dark
const TICK_COLOR = 'rgba(160,160,160,0.9)';        // readable in both modes

const TT = {
    contentStyle: {
        background: 'hsl(var(--card))',
        border: '1px solid rgba(128,128,128,0.25)',
        borderRadius: '12px',
        color: 'hsl(var(--foreground))',
        fontSize: '12px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        padding: '10px 14px',
    },
    itemStyle: { color: 'hsl(var(--foreground))' },
    labelStyle: { color: TICK_COLOR, fontWeight: 600, marginBottom: 4 },
    cursor: { fill: 'rgba(128,128,128,0.12)' },
};

// ── Animated Chart Card ─────────────────────────────────────────────────────

function ChartCard({
    icon: Icon,
    title,
    description,
    gradient,
    glow,
    isLoading,
    children,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
    glow: string;
    isLoading: boolean;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
        >
            {/* Coloured top strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} ${glow} shadow-lg`}>
                        <Icon className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-foreground">{title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>

                {/* Body */}
                {isLoading ? <Skeleton className="w-full h-[270px] rounded-xl" /> : children}
            </div>
        </motion.div>
    );
}

// ── Chart 1: Monthly Revenue ────────────────────────────────────────────────

function MonthlyRevenueChart({ data }: { data: { month: string; collected: number; pending: number }[] }) {
    if (!data?.length) return <EmptyState msg="Generate challans to view revenue trends." />;
    return (
        <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TT} formatter={((v: number) => [`Rs. ${v.toLocaleString()}`, undefined]) as any} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={2.5} fill="url(#gCollected)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} fill="url(#gPending)" dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ── Chart 2: 7-Day Attendance ───────────────────────────────────────────────

function AttendanceTrendChart({ data }: { data: { date: string; present: number; absent: number; leave: number }[] }) {
    const isEmpty = !data?.length || data.every(d => d.present === 0 && d.absent === 0 && d.leave === 0);
    if (isEmpty) return <EmptyState msg="No attendance records in the last 7 days." />;
    return (
        <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TT} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="leave" name="Leave" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" radius={[5, 5, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ── Chart 3: Class Enrollment ────────────────────────────────────────────────

const CLASS_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c026d3', '#db2777', '#e11d48', '#f43f5e'];

function ClassStrengthChart({ data }: { data: { class: string; students: number }[] }) {
    if (!data?.length) return <EmptyState msg="No class enrollment data yet." />;
    return (
        <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="class" tick={{ fontSize: 10, fill: TICK_COLOR }} axisLine={false} tickLine={false} width={78} />
                <Tooltip {...TT} formatter={((v: number) => [v, 'Students']) as any} />
                <Bar dataKey="students" radius={[0, 8, 8, 0]}>
                    {data.map((_, i) => <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

// ── Chart 4: Fee Status Donut ────────────────────────────────────────────────

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.06) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    return (
        <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
            fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="700">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

function FeeStatusDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
    if (!data?.length) return <EmptyState msg="No challan data for this month." />;
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
            <ResponsiveContainer width={200} height={200}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" labelLine={false} label={renderLabel}
                        outerRadius={90} innerRadius={52} dataKey="value" strokeWidth={0}>
                        {data.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip {...TT} formatter={((v: number, n: string) => [`${v} (${Math.round((v / total) * 100)}%)`, n]) as any} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 flex-1">
                {data.map(d => (
                    <div key={d.name} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: `${d.color}14` }}>
                        <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                            <span className="text-sm font-semibold">{d.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black" style={{ color: d.color }}>{d.value}</span>
                            <span className="text-xs text-muted-foreground ml-1">challans</span>
                        </div>
                    </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-1 border-t">Total: {total} challans this month</p>
            </div>
        </div>
    );
}

// ── Chart 5: Subject Radar ───────────────────────────────────────────────────

function SubjectRadarChart({ data }: { data: { subject: string; average: number; highest: number }[] }) {
    if (!data?.length) return <EmptyState msg="No exam marks recorded yet." />;
    return (
        <ResponsiveContainer width="100%" height={270}>
            <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <defs>
                    <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                <Radar name="Class Average" dataKey="average" stroke="#6366f1" fill="url(#radarGrad)" fillOpacity={0.3} strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
                <Radar name="Highest Score" dataKey="highest" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={2} strokeDasharray="5 3" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip {...TT} formatter={((v: number) => [`${v}%`, undefined]) as any} />
            </RadarChart>
        </ResponsiveContainer>
    );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ msg }: { msg: string }) {
    return (
        <div className="flex items-center justify-center h-[200px]">
            <p className="text-sm text-muted-foreground text-center px-6">{msg}</p>
        </div>
    );
}

// ── Main Export ──────────────────────────────────────────────────────────────

export function DashboardCharts() {
    const { data, isLoading } = useChartStats();

    return (
        <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Analytics & Insights</h2>
            </div>

            {/* Row 1 — Revenue + Attendance */}
            <div className="grid gap-5 lg:grid-cols-2">
                <ChartCard
                    icon={TrendingUp}
                    title="Monthly Revenue"
                    description="Collected vs. pending fees — last 6 months"
                    gradient="from-emerald-500 to-teal-600"
                    glow="shadow-emerald-500/40"
                    isLoading={isLoading}
                >
                    <MonthlyRevenueChart data={data?.monthlyRevenue ?? []} />
                </ChartCard>

                <ChartCard
                    icon={Activity}
                    title="Attendance Trend"
                    description="Present / Absent / Leave — last 7 days"
                    gradient="from-blue-500 to-indigo-600"
                    glow="shadow-blue-500/40"
                    isLoading={isLoading}
                >
                    <AttendanceTrendChart data={data?.attendanceTrend ?? []} />
                </ChartCard>
            </div>

            {/* Row 2 — Class Strength + Fee Donut */}
            <div className="grid gap-5 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <ChartCard
                        icon={BarChart2}
                        title="Class Enrollment"
                        description="Active students per class"
                        gradient="from-violet-500 to-purple-700"
                        glow="shadow-violet-500/40"
                        isLoading={isLoading}
                    >
                        <ClassStrengthChart data={data?.classStrength ?? []} />
                    </ChartCard>
                </div>

                <div className="lg:col-span-2">
                    <ChartCard
                        icon={PieIcon}
                        title="Fee Status"
                        description="Current month challan breakdown"
                        gradient="from-amber-500 to-orange-600"
                        glow="shadow-amber-500/40"
                        isLoading={isLoading}
                    >
                        <FeeStatusDonut data={data?.feeStatusBreakdown ?? []} />
                    </ChartCard>
                </div>
            </div>

            {/* Row 3 — Subject Radar */}
            <ChartCard
                icon={BookOpen}
                title="Subject Performance"
                description="Class average vs. highest score per subject across all recorded exams"
                gradient="from-rose-500 to-pink-600"
                glow="shadow-rose-500/40"
                isLoading={isLoading}
            >
                <SubjectRadarChart data={data?.subjectPerformance ?? []} />
            </ChartCard>
        </div>
    );
}
