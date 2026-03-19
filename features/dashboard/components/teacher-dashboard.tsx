'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTeacherChartStats } from '../api/use-teacher-chart-stats';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CheckSquare, Edit3, BookOpen, ArrowUpRight,
    Users, UserX, BookMarked, TrendingUp
} from 'lucide-react';
import { ROUTES } from '@/constants/globals';
import { format } from 'date-fns';
import { NoticeBoardWidget } from '@/features/notices/components/notice-board-widget';

const ttStyle = {
    contentStyle: {
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '10px',
        fontSize: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
    },
    itemStyle: { color: 'hsl(var(--foreground))' },
};

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub: string; color: string }) {
    return (
        <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
            <Card className="relative overflow-hidden border bg-card hover:shadow-lg transition-shadow">
                <div className={`absolute right-0 top-0 h-full w-1.5 rounded-r-xl ${color}`} />
                <CardContent className="p-5">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${color.replace('bg-', 'bg-').replace('-500', '-500/10')}`}>
                        <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function TeacherDashboard({ profile }: { profile: { id: string; full_name?: string } }) {
    const { data: stats, isLoading } = useTeacherChartStats(profile.id);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || 'Teacher';

    const attendanceRate = stats && stats.totalStudents > 0
        ? Math.round((stats.todayPresent / stats.totalStudents) * 100)
        : 0;

    const classFilter = stats?.managingClasses?.[0] ? `?class=${stats.managingClasses[0].id}` : '';

    const RADIAN = Math.PI / 180;
    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
        if (percent < 0.06) return null;
        const r = innerRadius + (outerRadius - innerRadius) * 0.55;
        return (
            <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
                fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <PageTransition>
            <div className="space-y-7">
                {/* ── Hero Banner ── */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-primary/60 px-6 py-7 text-white shadow-lg">
                    <div className="absolute right-0 top-0 h-full w-64 opacity-10 bg-[radial-gradient(circle_at_right,_white_0%,_transparent_65%)]" />
                    <p className="text-sm font-medium opacity-80">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
                    <h1 className="text-2xl font-bold mt-1">{greeting}, {firstName}! 👋</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3">
                        <p className="text-sm opacity-75 mr-2">Your managing classes:</p>
                        {stats?.managingClasses && stats.managingClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {stats.managingClasses.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                                        <BookOpen className="h-3.5 w-3.5 text-blue-100/90" />
                                        <span className="text-xs font-bold tracking-tight">{c.name} - {c.section}</span>
                                    </div>
                                ))}
                            </div>
                        ) : !isLoading && (
                            <div className="flex items-center gap-2 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30 backdrop-blur-sm">
                                <UserX className="h-3.5 w-3.5 text-rose-100" />
                                <span className="text-xs font-bold text-rose-50 tracking-tight">No Classes Assigned</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                        <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium border border-white/10">
                            📊 {attendanceRate}% Overall Attendance Rate
                        </div>
                    </div>
                </div>

                {/* ── Notice Board & Announcements ── */}
                <StaggerItem>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-1 rounded-full bg-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Latest Announcements</h2>
                        </div>
                        <NoticeBoardWidget role="TEACHER" />
                    </div>
                </StaggerItem>

                {/* ── KPIs ── */}
                <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StaggerItem><KpiCard icon={Users} label="Class Students" value={isLoading ? '...' : stats?.totalStudents ?? 0} sub="Active in your class" color="bg-blue-500" /></StaggerItem>
                    <StaggerItem><KpiCard icon={CheckSquare} label="Present Today" value={isLoading ? '...' : stats?.todayPresent ?? 0} sub="Marked present" color="bg-emerald-500" /></StaggerItem>
                    <StaggerItem><KpiCard icon={UserX} label="Absent Today" value={isLoading ? '...' : stats?.todayAbsent ?? 0} sub="Require follow-up" color="bg-red-500" /></StaggerItem>
                    <StaggerItem><KpiCard icon={BookMarked} label="Total Exams" value={isLoading ? '...' : stats?.pendingExams ?? 0} sub="System wide" color="bg-amber-500" /></StaggerItem>
                </StaggerList>

                {/* ── Charts ── */}
                <div className="grid gap-5 lg:grid-cols-5">
                    {/* Weekly Attendance Trend */}
                    <Card className="border bg-card shadow-sm lg:col-span-3">
                        <CardHeader className="pb-2 pt-5 px-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">Class Attendance Trend</CardTitle>
                                    <CardDescription className="text-xs">Weekly breakdown for your assigned class</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 pb-4">
                            {isLoading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={stats?.weeklyAttendance ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="tPresent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="tAbsent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip {...ttStyle} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                        <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2.5} fill="url(#tPresent)" dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                        <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} fill="url(#tAbsent)" dot={{ r: 3, fill: '#ef4444' }} />
                                        <Area type="monotone" dataKey="leave" name="Leave" stroke="#f59e0b" strokeWidth={2} fill="none" dot={{ r: 3, fill: '#f59e0b' }} strokeDasharray="4 3" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Today's Attendance Donut */}
                    <Card className="border bg-card shadow-sm lg:col-span-2">
                        <CardHeader className="pb-2 pt-5 px-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                                    <CheckSquare className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">Today&apos;s Status</CardTitle>
                                    <CardDescription className="text-xs">Class breakdown today</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center pb-4">
                            {isLoading ? <Skeleton className="h-[220px] w-full rounded-xl" /> :
                                stats?.todayBreakdown.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-16 text-center">No attendance marked for your students yet.</p>
                                ) : (
                                    <>
                                        <ResponsiveContainer width={180} height={180}>
                                            <PieChart>
                                                <Pie data={stats?.todayBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} labelLine={false} label={renderLabel} dataKey="value" strokeWidth={0}>
                                                    {(stats?.todayBreakdown ?? []).map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip {...ttStyle} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-col gap-2 w-full px-4">
                                            {(stats?.todayBreakdown ?? []).map(d => (
                                                <div key={d.name} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                                                        <span className="text-xs text-muted-foreground">{d.name}</span>
                                                    </div>
                                                    <span className="text-xs font-bold">{d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )
                            }
                        </CardContent>
                    </Card>
                </div>

                {/* Subject Performance Bar */}
                {(stats?.classSubjectAverages.length ?? 0) > 0 && (
                    <Card className="border bg-card shadow-sm">
                        <CardHeader className="pb-2 pt-5 px-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
                                    <BookOpen className="h-4 w-4 text-purple-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">Subject Performance (Your Class)</CardTitle>
                                    <CardDescription className="text-xs">Average scores for your assigned class</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 pb-4">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats?.classSubjectAverages ?? []} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                    <Tooltip {...ttStyle} formatter={((v: number) => [`${v}%`, 'Average']) as any} />
                                    <Bar dataKey="average" name="Average %" radius={[6, 6, 0, 0]}>
                                        {(stats?.classSubjectAverages ?? []).map((_, i) => (
                                            <Cell key={i} fill={`hsl(${260 + i * 15}, 70%, ${55 + i * 3}%)`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <div>
                    <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
                    <StaggerList className="grid gap-4 sm:grid-cols-3">
                        {[
                            { label: 'Mark Attendance', desc: 'Record daily student attendance', href: `${ROUTES.ATTENDANCE}${classFilter}`, icon: CheckSquare, gradient: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', color: 'text-blue-500' },
                            { label: 'Enter Exam Marks', desc: 'Evaluate and grade recent exams', href: `${ROUTES.MARKS}${classFilter}`, icon: Edit3, gradient: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20', color: 'text-purple-500' },
                            { label: 'View Students', desc: 'Access student profiles', href: `${ROUTES.STUDENTS}${classFilter}`, icon: BookOpen, gradient: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', color: 'text-emerald-500' },
                        ].map((item) => (
                            <StaggerItem key={item.href}>
                                <motion.a href={item.href} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                    className={`relative flex flex-col gap-4 rounded-xl bg-gradient-to-br ${item.gradient} border ${item.border} p-5 cursor-pointer group`}>
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-background/60 ${item.color}`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm text-foreground group-hover:${item.color} transition-colors`}>{item.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                    </div>
                                    <ArrowUpRight className={`absolute top-4 right-4 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${item.color}`} />
                                </motion.a>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                </div>
            </div>
        </PageTransition>
    );
}
