'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, User, ChevronLeft, ChevronRight } from 'lucide-react';

import { useStudents } from '@/features/students/hooks/use-students';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useGetStudentsAttendanceByDate } from '../api/use-get-students-attendance-by-date';

import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function ParentAttendanceView() {
    const [date, setDate] = useState<Date>(new Date());
    const dateStr = format(date, 'yyyy-MM-dd');

    const { data: profile } = useAuthProfile();
    const { data: children, isLoading: studentsLoading } = useStudents({ parentId: profile?.id });
    
    const studentIds = children?.map(c => c.id).filter((id): id is string => !!id) || [];
    const { data: attendance, isLoading: attendanceLoading } = useGetStudentsAttendanceByDate(studentIds, dateStr);

    const isLoading = studentsLoading || attendanceLoading || !profile;

    const getStatus = (studentId: string) => {
        const record = attendance?.find(r => r.student_id === studentId);
        return record?.status || 'NOT_MARKED';
    };

    return (
        <PageTransition>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Daily Attendance</h1>
                            <p className="text-sm text-muted-foreground">Monitor your children&apos;s daily attendance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setDate(d => {
                                const newDate = new Date(d);
                                newDate.setDate(d.getDate() - 1);
                                return newDate;
                            })}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Input
                            type="date"
                            value={dateStr}
                            onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                if (!isNaN(newDate.getTime())) setDate(newDate);
                            }}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="w-[170px] rounded-full border-primary/20 bg-background"
                        />

                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            disabled={dateStr === format(new Date(), 'yyyy-MM-dd')}
                            onClick={() => setDate(d => {
                                const newDate = new Date(d);
                                newDate.setDate(d.getDate() + 1);
                                return newDate;
                            })}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <Card className="border-none shadow-premium overflow-hidden">
                        <CardContent className="p-0">
                            <div className="space-y-4 p-6">
                                {[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                            </div>
                        </CardContent>
                    </Card>
                ) : (!children || children.length === 0) ? (
                    <Card className="border-dashed border-2 bg-muted/10">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <User className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="font-semibold text-muted-foreground">No children linked to your account</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-primary/10">
                                    <TableHead className="w-[300px] py-4">Student</TableHead>
                                    <TableHead>Class & Section</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {children.map((child: any) => (
                                    <TableRow key={child.id} className="hover:bg-primary/5 transition-colors border-b-primary/5">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
                                                    {child.photo_url ? (
                                                        <img src={child.photo_url} alt={child.full_name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
                                                            {child.full_name?.substring(0, 2)}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{child.full_name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">ROLL: {child.roll_number}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-none px-3">
                                                {child.classes?.name} — {child.classes?.section}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(() => {
                                                const status = getStatus(child.id);
                                                return (
                                                    <Badge 
                                                        variant="outline" 
                                                        className={cn(
                                                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                                                            status === 'PRESENT' && "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
                                                            status === 'ABSENT' && "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20",
                                                            status === 'LEAVE' && "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
                                                            status === 'NOT_MARKED' && "border-slate-200 bg-slate-50 text-slate-400"
                                                        )}
                                                    >
                                                        {status.replace('_', ' ')}
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </PageTransition>
    );
}
