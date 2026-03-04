'use client';

import { motion } from 'framer-motion';
import { User, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';

import { useStudents } from '@/features/students/hooks/use-students';
import { useGetStudentAttendance } from '../api/use-get-student-attendance';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function ChildAttendanceCard({ child }: { child: any }) {
    const { data: attendance, isLoading } = useGetStudentAttendance(child.id);

    const counts = { present: 0, absent: 0, leave: 0 };
    attendance?.forEach(r => {
        if (r.status === 'PRESENT') counts.present++;
        else if (r.status === 'ABSENT') counts.absent++;
        else counts.leave++;
    });

    const total = counts.present + counts.absent + counts.leave;
    const attRate = total > 0 ? Math.round((counts.present / total) * 100) : 0;

    return (
        <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-transparent px-5 py-4 flex items-center gap-4 border-b">
                <Avatar className="h-12 w-12 border-2 border-background shadow">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                        {child.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-bold text-lg">{child.full_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        {child.classes?.name} — Section {child.classes?.section}
                    </p>
                </div>
            </div>

            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-5"><Skeleton className="h-[100px] w-full" /></div>
                ) : (
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
                        <div className="p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Attendance Rate</p>
                            <p className={`text-2xl font-bold ${attRate >= 75 ? 'text-emerald-500' : attRate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{attRate}%</p>
                        </div>
                        <div className="p-4 flex flex-col justify-center">
                            <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Present:</span><span className="font-bold text-emerald-600">{counts.present}</span></div>
                            <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Absent:</span><span className="font-bold text-red-600">{counts.absent}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Leave:</span><span className="font-bold text-amber-600">{counts.leave}</span></div>
                        </div>
                        <div className="col-span-1 md:col-span-1 bg-muted/10 p-4 max-h-[160px] overflow-y-auto">
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Recent Records</p>
                            {(!attendance || attendance.length === 0) ? (
                                <p className="text-xs text-muted-foreground">No records found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {attendance.slice(0, 10).map((record) => (
                                        <div key={record.record_date} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                                            <span>{format(new Date(record.record_date), 'MMM dd, yyyy')}</span>
                                            <Badge variant="outline" className={`text-[10px] uppercase ${record.status === 'PRESENT' ? 'border-emerald-500 text-emerald-600' : record.status === 'ABSENT' ? 'border-red-500 text-red-600' : 'border-amber-500 text-amber-600'}`}>
                                                {record.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ParentAttendanceView() {
    const { data: children, isLoading } = useStudents();

    return (
        <PageTransition>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Attendance Records</h1>
                            <p className="text-sm text-muted-foreground">View your children&apos;s recent attendance</p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <StaggerList className="grid gap-5 lg:grid-cols-2">
                        {[0, 1].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
                    </StaggerList>
                ) : children?.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/10">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <User className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="font-semibold text-muted-foreground">No children linked to your account</p>
                        </CardContent>
                    </Card>
                ) : (
                    <StaggerList className="grid gap-5 lg:grid-cols-2">
                        {children?.map((child: any) => (
                            <StaggerItem key={child.id}>
                                <ChildAttendanceCard child={child} />
                            </StaggerItem>
                        ))}
                    </StaggerList>
                )}
            </div>
        </PageTransition>
    );
}
