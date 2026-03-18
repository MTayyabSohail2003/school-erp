'use client';

import React, { useState } from 'react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useStudents } from '@/features/students/hooks/use-students';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, User, Award, BookOpen, TrendingUp, LayoutGrid, List, Users, Activity, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

// ── Premium KPI Card ────────────────────────────────────────────────────────

type KpiCardProps = {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    gradient: string;
    glow: string;
    trend?: string;
    trendUp?: boolean;
};

// Removed Framer motion animation to adhere to use client / motion rules cleanly
function KpiCard({ title, value, subtitle, icon: Icon, gradient, glow, trend, trendUp = true }: KpiCardProps) {
    return (
        <div className="h-full transition-transform hover:-translate-y-1 hover:scale-[1.02] duration-300">
            <div className={`relative h-full rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-xl ${glow} overflow-hidden`}>
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
        </div>
    );
}

// Fetch marks for a specific student  
function useStudentMarks(studentId?: string) {
    return useQuery({
        queryKey: ['student-marks', studentId],
        queryFn: async () => {
            if (!studentId) return [];
            const supabase = createClient();
            const { data } = await supabase
                .from('exam_marks')
                .select('marks_obtained, total_marks, subjects(name), exams(name)')
                .eq('student_id', studentId);
            return (data ?? []).map((m: { subjects: { name: string } | { name: string }[], exams: { name: string } | { name: string }[], total_marks: number, marks_obtained: number }) => ({
                subject: Array.isArray(m.subjects) ? m.subjects[0]?.name : m.subjects?.name ?? 'N/A',
                exam: Array.isArray(m.exams) ? m.exams[0]?.name : m.exams?.name ?? 'Exam',
                score: m.total_marks ? Math.round((m.marks_obtained / m.total_marks) * 100) : 0,
            }));
        },
        enabled: Boolean(studentId),
    });
}

// Fetch attendance for a specific student (last 30 days)
function useStudentAttendance(studentId?: string) {
    return useQuery({
        queryKey: ['student-attendance', studentId],
        queryFn: async () => {
            if (!studentId) return { present: 0, absent: 0, leave: 0 };
            const supabase = createClient();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', studentId)
                .gte('record_date', thirtyDaysAgo.toISOString().split('T')[0]);
            const counts = { present: 0, absent: 0, leave: 0 };
            for (const r of data ?? []) {
                if (r.status === 'PRESENT') counts.present++;
                else if (r.status === 'ABSENT') counts.absent++;
                else counts.leave++;
            }
            return counts;
        },
        enabled: Boolean(studentId),
    });
}

export type DashboardChild = { id?: string; full_name?: string; roll_number?: string; photo_url?: string; monthly_fee?: number | string | null; classes?: { name: string; section: string } };

function ChildCard({ child }: { child: DashboardChild }) {
    const { data: marks, isLoading: marksLoading } = useStudentMarks(child.id);
    const { data: attendance, isLoading: attLoading } = useStudentAttendance(child.id);
    const total = (attendance?.present ?? 0) + (attendance?.absent ?? 0) + (attendance?.leave ?? 0);
    const attRate = total > 0 ? Math.round((attendance!.present / total) * 100) : 0;
    const subjectScores = (marks ?? []).slice(-6);

    return (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden h-full flex flex-col">
            {/* Child Header */}
            <div className="bg-gradient-to-r from-primary/15 via-primary/8 to-transparent px-5 py-4 flex items-center gap-4 border-b">
                <Avatar className="h-14 w-14 border-2 border-background shadow">
                    {child.photo_url && <AvatarImage src={child.photo_url} alt={child.full_name} style={{ objectFit: 'cover' }} />}
                    <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                        {child.full_name?.substring(0, 2).toUpperCase() || <User className="h-6 w-6" />}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{child.full_name || 'Student'}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        {child.classes?.name && child.classes?.section 
                            ? `${child.classes.name} — Section ${child.classes.section}`
                            : 'Unassigned Class'}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Roll No</p>
                    <p className="text-xl font-black text-primary">#{child.roll_number || '??'}</p>
                    {child.monthly_fee && (
                        <div className="mt-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Monthly Fee</p>
                            <p className="text-sm font-bold">Rs {Number(child.monthly_fee).toLocaleString()}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border border-b">
                {/* Attendance Chart */}
                <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Award className="h-3 w-3" /> Attendance (30D)
                    </p>
                    {attLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-2xl font-black ${attRate >= 75 ? 'text-emerald-500' : attRate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {attRate}%
                                </span>
                                <Badge variant="outline" className={`text-xs ${attRate >= 75 ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' : attRate >= 60 ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' : 'border-red-500/30 text-red-600 bg-red-500/10'}`}>
                                    {attRate >= 75 ? 'Good' : attRate >= 60 ? 'Average' : 'Low'}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {[
                                    { label: 'Pr', val: attendance?.present ?? 0, color: 'text-emerald-500 bg-emerald-500/10' },
                                    { label: 'Ab', val: attendance?.absent ?? 0, color: 'text-red-500 bg-red-500/10' },
                                    { label: 'Lv', val: attendance?.leave ?? 0, color: 'text-amber-500 bg-amber-500/10' },
                                ].map(s => (
                                    <div key={s.label} className={`rounded-lg py-2 px-1 text-center ${s.color}`}>
                                        <p className="text-base font-bold">{s.val}</p>
                                        <p className="text-[10px] uppercase font-bold opacity-60">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Subject Scores Chart */}
                <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" /> Academic Skill
                    </p>
                    {marksLoading ? <Skeleton className="h-[120px] w-full rounded-lg" /> :
                        subjectScores.length === 0 ? (
                            <div className="h-[120px] flex items-center justify-center border border-dashed rounded-lg bg-muted/5">
                                <p className="text-[10px] text-muted-foreground text-center px-4">No exam records.</p>
                            </div>
                        ) : (
                            <div className="h-[120px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={subjectScores} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                                        <PolarGrid stroke="hsl(var(--border))" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                                        <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )
                    }
                </div>
            </div>

            {/* Recent Scores Bar */}
            {!marksLoading && subjectScores.length > 0 && (
                <div className="px-4 pb-4 pt-3 mt-auto">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" /> Score Breakdown
                    </p>
                    <div className="h-[80px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectScores} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="subject" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} hide />
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Tooltip {...ttStyle} formatter={(v: any) => [`${v}%`, 'Score']} />
                                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                    {subjectScores.map((s: { score: number }, i: number) => (
                                        <Cell key={i} fill={s.score >= 75 ? '#10b981' : s.score >= 50 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

export function ParentDashboard({ profile }: { profile: { id: string; full_name?: string } }) {
    const { data: children, isLoading } = useStudents(profile.id);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const totalFee = children?.reduce((sum, child) => sum + (Number((child as DashboardChild).monthly_fee) || 0), 0) || 0;

    const filteredChildren = (children as unknown as DashboardChild[])?.filter((child) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            child.full_name?.toLowerCase().includes(q) ||
            child.roll_number?.toLowerCase().includes(q)
        );
    });

    return (
        <PageTransition>
            <div className="space-y-8">
                {/* ── Core KPIs ── */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-4 w-1 rounded-full bg-primary" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Overview</h2>
                    </div>
                    
                    <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StaggerItem>
                            <KpiCard
                                title="Total Children"
                                value={isLoading ? '—' : children?.length ?? 0}
                                subtitle="Active enrollments"
                                icon={Users}
                                gradient="from-blue-600 to-indigo-700"
                                glow="shadow-xl shadow-blue-500/30"
                                trend="Active"
                            />
                        </StaggerItem>
                        <StaggerItem>
                            <KpiCard
                                title="Monthly Fee"
                                value={isLoading ? '—' : `Rs ${totalFee.toLocaleString()}`}
                                subtitle="Total consolidated fee"
                                icon={TrendingUp}
                                gradient="from-violet-600 to-purple-700"
                                glow="shadow-xl shadow-violet-500/30"
                                trend="This Month"
                            />
                        </StaggerItem>
                        <StaggerItem>
                            <KpiCard
                                title="Account Status"
                                value="Active"
                                subtitle="All systems operational"
                                icon={Activity}
                                gradient="from-emerald-500 to-teal-600"
                                glow="shadow-xl shadow-emerald-500/30"
                                trend="Monitor"
                            />
                        </StaggerItem>
                    </StaggerList>
                </div>

                {/* ── Children Detail Cards ── */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-base font-semibold text-foreground">Your Children</h2>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by name or roll no..."
                                    className="pl-8 h-9 shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center bg-muted/50 p-1 rounded-lg border w-full sm:w-auto">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 px-3 rounded-md shadow-none"
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4 mr-1.5" />
                                Cards
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 px-3 rounded-md shadow-none"
                                onClick={() => setViewMode('table')}
                            >
                                <List className="h-4 w-4 mr-1.5" />
                                Table
                            </Button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <StaggerList className="grid gap-5 lg:grid-cols-2">
                            {[0, 1].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                        </StaggerList>
                    ) : children?.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/10">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <User className="h-12 w-12 text-muted-foreground mb-3" />
                                <p className="font-semibold text-muted-foreground">
                                    {searchQuery ? 'No children found matching your search.' : 'No children linked to your account'}
                                </p>
                                {!searchQuery && <p className="text-sm text-muted-foreground mt-1">Please contact the school administration.</p>}
                            </CardContent>
                        </Card>
                    ) : viewMode === 'table' ? (
                        <Card className="overflow-hidden border shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Student</th>
                                            <th className="px-4 py-3 font-semibold">Roll No</th>
                                            <th className="px-4 py-3 font-semibold">Class</th>
                                            <th className="px-4 py-3 font-semibold text-right">Monthly Fee</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {(filteredChildren as unknown as DashboardChild[])?.map((child) => (
                                            <tr key={child.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 text-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            {child.photo_url && <AvatarImage src={child.photo_url} alt={child.full_name} style={{ objectFit: 'cover' }} />}
                                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                                {child.full_name?.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="font-medium">{child.full_name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-nowrap">#{child.roll_number || '??'}</td>
                                                <td className="px-4 py-3 text-muted-foreground text-nowrap">
                                                    {child.classes?.name && child.classes?.section
                                                        ? `${child.classes.name} — Section ${child.classes.section}`
                                                        : 'Unassigned'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-nowrap">
                                                    {child.monthly_fee ? `Rs ${Number(child.monthly_fee).toLocaleString()}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {(filteredChildren as unknown as DashboardChild[])?.map((child) => (
                                <div key={child.id}>
                                    <ChildCard child={child} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
