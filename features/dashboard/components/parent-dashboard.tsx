'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useStudents } from '@/features/students/hooks/use-students';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, User, Award, BookOpen, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
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
            return (data ?? []).map((m: any) => ({
                subject: m.subjects?.name ?? 'N/A',
                exam: m.exams?.name ?? 'Exam',
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

function ChildCard({ child }: { child: any }) {
    const { data: marks, isLoading: marksLoading } = useStudentMarks(child.id);
    const { data: attendance, isLoading: attLoading } = useStudentAttendance(child.id);
    const total = (attendance?.present ?? 0) + (attendance?.absent ?? 0) + (attendance?.leave ?? 0);
    const attRate = total > 0 ? Math.round((attendance!.present / total) * 100) : 0;
    const subjectScores = (marks ?? []).slice(-6); // last 6 subjects

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="rounded-2xl border bg-card shadow-sm overflow-hidden"
        >
            {/* Child Header */}
            <div className="bg-gradient-to-r from-primary/15 via-primary/8 to-transparent px-5 py-4 flex items-center gap-4 border-b">
                <Avatar className="h-14 w-14 border-2 border-background shadow">
                    <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                        {child.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-bold text-lg">{child.full_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {child.classes?.name} — Section {child.classes?.section}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Roll No</p>
                    <p className="text-xl font-bold text-primary">#{child.roll_number}</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {/* Attendance Chart */}
                <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Award className="h-3 w-3" /> Attendance (Last 30 Days)
                    </p>
                    {attLoading ? <Skeleton className="h-[140px] w-full rounded-lg" /> : (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-2xl font-bold ${attRate >= 75 ? 'text-emerald-500' : attRate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {attRate}%
                                </span>
                                <Badge variant="outline" className={`text-xs ${attRate >= 75 ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' : attRate >= 60 ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' : 'border-red-500/30 text-red-600 bg-red-500/10'}`}>
                                    {attRate >= 75 ? 'Good' : attRate >= 60 ? 'Average' : 'Low'}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {[
                                    { label: 'Present', val: attendance?.present ?? 0, color: 'text-emerald-500 bg-emerald-500/10' },
                                    { label: 'Absent', val: attendance?.absent ?? 0, color: 'text-red-500 bg-red-500/10' },
                                    { label: 'Leave', val: attendance?.leave ?? 0, color: 'text-amber-500 bg-amber-500/10' },
                                ].map(s => (
                                    <div key={s.label} className={`rounded-lg p-2 text-center ${s.color}`}>
                                        <p className="text-lg font-bold">{s.val}</p>
                                        <p className="text-xs opacity-80">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Subject Scores Chart */}
                <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" /> Exam Performance
                    </p>
                    {marksLoading ? <Skeleton className="h-[140px] w-full rounded-lg" /> :
                        subjectScores.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">No exam marks recorded yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={140}>
                                <RadarChart data={subjectScores} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                                    <PolarGrid stroke="hsl(var(--border))" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                                    <Tooltip {...ttStyle} formatter={((v: number) => [`${v}%`, 'Score']) as any} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )
                    }
                </div>
            </div>

            {/* Recent Scores Bar */}
            {!marksLoading && subjectScores.length > 0 && (
                <div className="px-4 pb-4 pt-2 border-t">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" /> Score Breakdown
                    </p>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={subjectScores} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip {...ttStyle} formatter={((v: number) => [`${v}%`, 'Score']) as any} />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                {subjectScores.map((s, i) => (
                                    <Cell key={i} fill={s.score >= 75 ? '#10b981' : s.score >= 50 ? '#f59e0b' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
}

export function ParentDashboard({ profile }: { profile: { full_name?: string } }) {
    const { data: children, isLoading } = useStudents();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || 'there';

    return (
        <PageTransition>
            <div className="space-y-7">
                {/* ── Hero Banner ── */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-7 text-white shadow-xl">
                    <div className="absolute right-0 top-0 h-full w-48 opacity-10 bg-[radial-gradient(circle_at_right,_white_0%,_transparent_65%)]" />
                    <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-white/5" />
                    <p className="text-sm font-medium opacity-75">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
                    <h1 className="text-2xl font-bold mt-1">{greeting}, {firstName}! 👋</h1>
                    <p className="text-sm opacity-70 mt-1">Track your {children?.length === 1 ? "child's" : "children's"} progress from one place.</p>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium">
                            👨‍👩‍👧 {isLoading ? '...' : children?.length ?? 0} {(children?.length ?? 0) === 1 ? 'Child' : 'Children'} Enrolled
                        </div>
                    </div>
                </div>

                {/* ── Children Detail Cards ── */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-base font-semibold text-foreground">Your Children</h2>
                    </div>

                    {isLoading ? (
                        <StaggerList className="grid gap-5 lg:grid-cols-2">
                            {[0, 1].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                        </StaggerList>
                    ) : children?.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/10">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <User className="h-12 w-12 text-muted-foreground mb-3" />
                                <p className="font-semibold text-muted-foreground">No children linked to your account</p>
                                <p className="text-sm text-muted-foreground mt-1">Please contact the school administration.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <StaggerList className="grid gap-5 lg:grid-cols-2">
                            {children?.map((child: any) => (
                                <StaggerItem key={child.id}>
                                    <ChildCard child={child} />
                                </StaggerItem>
                            ))}
                        </StaggerList>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
