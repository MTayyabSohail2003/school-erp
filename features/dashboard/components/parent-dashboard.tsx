'use client';

import { useStudents } from '@/features/students/hooks/use-students';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { User, DollarSign, Award, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ParentDashboard({ profile }: { profile: any }) {
    // Due to Row Level Security (RLS), this hook will only return students 
    // where student.parent_id === profile.id
    const { data: children, isLoading } = useStudents();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    const today = new Date();

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
                            Welcome to the Parent Portal. Here is the overview for {format(today, 'MMMM yyyy')}.
                        </p>
                    </div>
                </div>

                {/* ── Children Overview ── */}
                <div>
                    <h2 className="text-base font-semibold mb-4 text-foreground">Your Children</h2>
                    <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <Card key={i} className="h-32 animate-pulse bg-muted/20" />
                            ))
                        ) : children?.length === 0 ? (
                            <Card className="col-span-full bg-muted/20 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <User className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground font-medium">No children linked to your account.</p>
                                    <p className="text-xs text-muted-foreground">Please contact the school administration.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            children?.map((child: any) => (
                                <StaggerItem key={child.id}>
                                    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                                        <Card className="overflow-hidden border-border bg-card">
                                            <CardContent className="p-0">
                                                <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 pb-4 flex items-center gap-4">
                                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                            {child.full_name?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{child.full_name}</h3>
                                                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                                            <GraduationCap className="h-3.5 w-3.5" />
                                                            {child.classes?.name} - Section {child.classes?.section}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-muted/10">
                                                    <div className="p-3 text-center flex flex-col items-center justify-center">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                                                            <Award className="h-3 w-3" /> Roll No
                                                        </span>
                                                        <span className="font-semibold">{child.roll_number}</span>
                                                    </div>
                                                    <div className="p-3 text-center flex flex-col items-center justify-center">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                                                            <DollarSign className="h-3 w-3" /> Fee Status
                                                        </span>
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none px-1.5 py-0">
                                                            Good
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </StaggerItem>
                            ))
                        )}
                    </StaggerList>
                </div>

                {/* Notice Board Placeholder */}
                <div className="grid gap-4 sm:grid-cols-2 mt-8">
                    <Card className="bg-muted/10">
                        <CardHeader>
                            <CardTitle className="text-sm">Recent Fee Slips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-4 italic">No pending fee slips for this month.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/10">
                        <CardHeader>
                            <CardTitle className="text-sm">Recent Report Cards</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-4 italic">Exams are not yet graded.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTransition>
    );
}
