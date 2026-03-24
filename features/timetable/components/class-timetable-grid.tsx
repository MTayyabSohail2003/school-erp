'use client';

import { useState } from 'react';
import { useGetPeriods } from '../hooks/use-get-periods';
import { useBulkUpsertTimetable } from '../hooks/use-bulk-upsert-timetable';
import { type TimetableWithDetails } from '../schemas/timetable.schema';
import { type ClassRecord } from '@/features/classes/api/classes.api';
import { AssignPeriodDialog } from './assign-period-dialog';
import { toast } from 'sonner';

import { Plus, Zap, Loader2, Users, UserPlus, GraduationCap, ChevronRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { useClasses, useUpdateClass } from '@/features/classes/hooks/use-classes';
import { useStudentsByClass } from '@/features/students/hooks/use-students-by-class';
import { useGetAllTimetable } from '../hooks/use-get-all-timetable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
];

interface ClassTimetableGridProps {
    classRecord: ClassRecord;
    academicYear: string;
    timetable: TimetableWithDetails[];
    selectedBrush?: {
        teacherId: string;
        subjectId: string;
        teacherName: string;
        subjectName: string;
    } | null;
}

export function ClassTimetableGrid({ classRecord, academicYear, timetable, selectedBrush }: ClassTimetableGridProps) {
    const { data: periods, isLoading: isPeriodsLoading } = useGetPeriods();
    const bulkUpsert = useBulkUpsertTimetable();

    const handleCellClick = (periodId: string, day: number) => {
        if (!selectedBrush) return;

        // CHECK FOR TEACHER CONFLICT DYNAMICALLY
        // 1. Is this teacher a primary in-charge?
        const isPrimaryInCharge = allClasses?.some(c => c.class_teacher_id === selectedBrush.teacherId && c.is_primary);
        if (isPrimaryInCharge) {
            toast.error(`Error: ${selectedBrush.teacherName} is a Primary Class In-Charge (Available for their class only).`);
            return;
        }

        // 2. Is this teacher already busy at this specific slot elsewhere?
        const hasSlotConflict = allTimetable?.some(entry => 
            entry.teacher_id === selectedBrush.teacherId && 
            entry.period_id === periodId && 
            entry.day_of_week === day &&
            entry.class_id !== classRecord.id
        );

        if (hasSlotConflict) {
            toast.error(`Error: ${selectedBrush.teacherName} is already scheduled for this period in another class.`);
            return;
        }

        bulkUpsert.mutate([{
            class_id: classRecord.id,
            period_id: periodId,
            day_of_week: day,
            teacher_id: selectedBrush.teacherId,
            subject_id: selectedBrush.subjectId,
            academic_year: academicYear
        }], {
            onSuccess: () => toast.success(`Assigned ${selectedBrush.subjectName} to period.`),
            onError: (err: Error) => toast.error(err.message || 'Failed to assign period.')
        });
    };

    const { data: staff, isLoading: isTeachersLoading } = useGetStaff();
    const { data: students, isLoading: isStudentsLoading } = useStudentsByClass(classRecord.id);
    const { data: allClasses } = useClasses();
    const { data: allTimetable } = useGetAllTimetable(academicYear);
    const updateClassMutation = useUpdateClass();

    const currentTeacher = staff?.find(s => s.id === classRecord.class_teacher_id);

    // COLLISION DETECTION LOGIC
    // 1. Teachers who are already class in-charges elsewhere
    const assignedClassTeachers = allClasses
        ?.filter(c => c.id !== classRecord.id && c.class_teacher_id)
        .map(c => c.class_teacher_id) || [];

    // 2. Teachers who have ANY periods assigned anywhere in the school (excluding current class)
    const teachersWithPeriods = allTimetable
        ?.filter(t => t.class_id !== classRecord.id)
        .map(t => t.teacher_id) || [];

    // Combine for a set of "Reserved" teachers
    const reservedTeacherIds = new Set([...assignedClassTeachers, ...teachersWithPeriods]);

    const handleTeacherChange = (teacherId: string) => {
        updateClassMutation.mutate({
            id: classRecord.id,
            updates: { class_teacher_id: teacherId }
        });
    };

    const isPrimary = classRecord.name.toLowerCase().includes('nursery') || 
                      classRecord.name.toLowerCase().includes('prep') || 
                      ['1', '2', '3', '4'].some(grade => {
                          const regex = new RegExp(`(^|\\s)${grade}(\\s|$)`, 'i');
                          return regex.test(classRecord.name);
                      });

    const [dialogConfig, setDialogConfig] = useState<{
        open: boolean;
        periodId: string;
        dayOfWeek: number;
        existingEntry?: TimetableWithDetails;
    } | null>(null);

    const [repeatSourceDay, setRepeatSourceDay] = useState<number>(1);
    const [repeatTargetDay, setRepeatTargetDay] = useState<number>(2);

    const handleRepeatDay = () => {
        if (repeatSourceDay === repeatTargetDay) {
            toast.error('Source and target days must be different.');
            return;
        }
        const sourceEntries = timetable.filter(e => e.day_of_week === repeatSourceDay);
        if (sourceEntries.length === 0) {
            toast.error(`No periods assigned on ${DAYS[repeatSourceDay - 1].name} to repeat.`);
            return;
        }
        const entries = sourceEntries.map(e => ({
            class_id: classRecord.id,
            period_id: e.period_id,
            day_of_week: repeatTargetDay,
            teacher_id: e.teacher_id,
            subject_id: e.subject_id,
            academic_year: academicYear,
        }));
        bulkUpsert.mutate(entries, {
            onSuccess: () => toast.success(`Copied ${entries.length} period(s) to ${DAYS[repeatTargetDay - 1].name}.`),
            onError: (err: Error) => toast.error(err.message || 'Failed to repeat day.'),
        });
    };

    const handleQuickFill = () => {
        if (!classRecord.class_teacher_id) {
            toast.error('No class teacher assigned to this class. Please assign one below.');
            return;
        }

        if (!periods || !classRecord.id) return;

        // Generate entries for all periods and all days
        const newEntries = [];
        for (const day of DAYS) {
            for (const period of periods) {
                // Only fill if slot is empty
                const cellKey = `${day.id}-${period.id}`;
                if (!gridMap.has(cellKey)) {
                    newEntries.push({
                        class_id: classRecord.id,
                        period_id: period.id,
                        day_of_week: day.id,
                        teacher_id: classRecord.class_teacher_id,
                        subject_id: null, // Admin can set subject later
                        academic_year: academicYear
                    });
                }
            }
        }

        if (newEntries.length === 0) {
            toast.info('All periods are already assigned.');
            return;
        }

        bulkUpsert.mutate(newEntries, {
            onSuccess: () => toast.success(`Quick-filled ${newEntries.length} periods with Class Teacher.`),
            onError: (err: Error) => toast.error(err.message || 'Failed to bulk assign periods.')
        });
    };

    if (isPeriodsLoading) {
        return <div className="h-64 flex items-center justify-center border rounded-xl bg-muted/20 animate-pulse text-sm text-muted-foreground">Loading timetable matrix...</div>;
    }

    if (!periods || periods.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-xl">No periods defined in the system.</div>;
    }

    // Lookup dict for O(1) rendering
    // key: "day-periodId"
    const gridMap = new Map<string, TimetableWithDetails>();
    timetable.forEach(entry => {
        gridMap.set(`${entry.day_of_week}-${entry.period_id}`, entry);
    });

    const openAssignDialog = (day: number, periodId: string, entry?: TimetableWithDetails) => {
        setDialogConfig({ open: true, dayOfWeek: day, periodId, existingEntry: entry });
    };

    return (
        <div className="space-y-4">
            {isPrimary ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-8 space-y-4"
                    >
                        {/* COMPACT PRIMARY HEADER */}
                        <Card className="rounded-[2rem] border-2 border-primary/5 shadow-lg shadow-primary/[0.02] overflow-hidden bg-gradient-to-br from-primary/[0.03] to-transparent">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                            Primary Level
                                        </div>
                                        <h1 className="text-4xl font-black tracking-tight">
                                            {classRecord.name} <span className="text-primary/30">-</span> {classRecord.section}
                                        </h1>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-3 rounded-lg border-primary/10 bg-primary/5 text-muted-foreground whitespace-nowrap">
                                                Session {academicYear}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="hidden md:block w-px h-16 bg-border/50" />

                                    <div className="flex-1 w-full max-w-sm space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-300",
                                                currentTeacher 
                                                    ? "bg-primary/10 border-primary/20 text-primary" 
                                                    : "bg-rose-500/5 border-rose-500/10 text-rose-500"
                                            )}>
                                                {currentTeacher ? <Users className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Class In-Charge</p>
                                                <h3 className="text-lg font-bold truncate">
                                                    {currentTeacher ? currentTeacher.full_name : 'Pending Assignment'}
                                                </h3>
                                            </div>
                                        </div>

                                        <Select 
                                            value={classRecord.class_teacher_id || ''} 
                                            onValueChange={handleTeacherChange}
                                            disabled={updateClassMutation.isPending}
                                        >
                                            <SelectTrigger className="h-10 border bg-background/50 rounded-xl font-semibold text-xs focus:ring-primary/20">
                                                <SelectValue placeholder="Assign a teacher..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {staff?.map(teacher => {
                                                    const isReserved = reservedTeacherIds.has(teacher.id || '');
                                                    return (
                                                        <SelectItem 
                                                            key={teacher.id} 
                                                            value={teacher.id || ''} 
                                                            className="text-xs"
                                                            disabled={isReserved}
                                                        >
                                                            <div className="flex items-center justify-between w-full gap-4">
                                                                <span>{teacher.full_name}</span>
                                                                {isReserved && (
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground opacity-70">
                                                                        (Occupied)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        {updateClassMutation.isPending && (
                                            <p className="text-[9px] text-primary animate-pulse font-bold flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 animate-spin" /> Synchronizing...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* QUICK ACTION BUTTON */}
                        {!isTeachersLoading && (
                            <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Zap className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <p className="text-xs font-medium text-amber-700/80">
                                        Single-Teacher mode is active. You can auto-fill the entire schedule with the assigned in-charge.
                                    </p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-9 px-4 rounded-xl text-xs font-bold border-amber-500/20 hover:bg-amber-500/10 text-amber-700 transition-all active:scale-95"
                                    onClick={handleQuickFill}
                                    disabled={bulkUpsert.isPending}
                                >
                                    Quick Fill
                                </Button>
                            </div>
                        )}
                    </motion.div>

                    {/* CLASS ROSTER (STUDENTS) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <h3 className="font-black text-lg tracking-tight">Class Roster</h3>
                            </div>
                            <Badge variant="outline" className="font-bold border-primary/20 bg-primary/5 text-primary">
                                {students?.length ?? 0} Students
                            </Badge>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                            {isStudentsLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-16 rounded-2xl bg-muted/20 animate-pulse border border-border/50" />
                                ))
                            ) : students?.length === 0 ? (
                                <div className="py-12 text-center border-2 border-dashed rounded-3xl bg-muted/5 flex flex-col items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No active students</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {students?.map((student, i) => (
                                        <motion.div
                                            key={student.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group flex items-center justify-between p-4 rounded-2xl border bg-card hover:bg-primary/[0.02] hover:border-primary/20 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {student.roll_number}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground truncate max-w-[120px]">{student.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Active Enrollment</p>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        <Button 
                            variant="ghost" 
                            className="w-full h-11 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/30"
                            asChild
                        >
                            <a href={`/dashboard/students?class=${classRecord.id}`}>
                                View Full Directory
                            </a>
                        </Button>
                    </motion.div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-primary/[0.08] to-transparent border border-primary/20 p-5 rounded-2xl gap-4 shadow-[0_2px_10px_rgba(var(--primary),0.05)]">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-inner">
                                <Zap className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-tight">Period Management System</p>
                                <p className="text-[11px] text-muted-foreground leading-snug">5th to 10th Classes follow a multi-teacher period system. Manage each time slot individually.</p>
                            </div>
                        </div>

                        <Button 
                            size="sm" 
                            variant="default" 
                            className="w-full sm:w-auto h-11 px-6 rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                            onClick={handleQuickFill}
                            disabled={bulkUpsert.isPending}
                        >
                            {bulkUpsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-primary-foreground/30" />}
                            Quick Fill Class Teacher
                        </Button>
                    </div>

                    {/* REPEAT DAY PANEL */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-primary/10 bg-primary/[0.02]">
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                                <Copy className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-foreground">Repeat Day</p>
                                <p className="text-[10px] text-muted-foreground">Clone all assigned periods from one day to another.</p>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                            <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-1">Source Day</label>
                                <select
                                    className="w-full h-10 text-xs bg-background border border-input rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                    value={repeatSourceDay}
                                    onChange={(e) => setRepeatSourceDay(Number(e.target.value))}
                                >
                                    {DAYS.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end pb-0.5 justify-center">
                                <span className="text-xs text-muted-foreground font-bold">→</span>
                            </div>

                            <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-1">Target Day</label>
                                <select
                                    className="w-full h-10 text-xs bg-background border border-input rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                    value={repeatTargetDay}
                                    onChange={(e) => setRepeatTargetDay(Number(e.target.value))}
                                >
                                    {DAYS.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                className="h-10 px-5 rounded-xl text-xs font-bold border-primary/20 hover:bg-primary/5 transition-all active:scale-95 self-end"
                                onClick={handleRepeatDay}
                                disabled={bulkUpsert.isPending}
                            >
                                {bulkUpsert.isPending
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                    : <Copy className="h-3.5 w-3.5 mr-1" />
                                }
                                Repeat
                            </Button>
                        </div>
                    </div>

                    <div className="relative border rounded-xl overflow-hidden bg-card shadow-sm w-full max-w-full min-w-0">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4 border-b border-r w-24 sticky left-0 bg-muted/95 backdrop-blur shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-20">Day</th>
                                        {periods.map(period => (
                                            <th key={period.id} className="px-4 py-4 border-b text-center min-w-[150px] max-w-[180px]">
                                                <div className="text-foreground/90">{period.name}</div>
                                                <div className="font-normal opacity-60 lowercase mt-0.5 tracking-normal flex items-center justify-center gap-1">
                                                    <span className="tabular-nums">{period.start_time.substring(0, 5)}</span>
                                                    <span className="opacity-40">-</span>
                                                    <span className="tabular-nums">{period.end_time.substring(0, 5)}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {DAYS.map((day) => (
                                        <tr key={day.id} className="group hover:bg-muted/5 transition-colors">
                                            <td className="px-5 py-4 border-r font-bold text-xs sticky left-0 bg-card group-hover:bg-muted/10 z-20 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                {day.name}
                                            </td>
                                            {periods.map(period => {
                                                const cellKey = `${day.id}-${period.id}`;
                                                const entry = gridMap.get(cellKey);

                                                return (
                                                    <td 
                                                        key={period.id} 
                                                        className={cn(
                                                            "p-2 relative group/cell border-r last:border-r-0 align-top h-24 transition-colors",
                                                            selectedBrush ? "cursor-copy hover:bg-primary/5 active:bg-primary/10" : "hover:bg-muted/10"
                                                        )}
                                                        onClick={() => handleCellClick(period.id, day.id)}
                                                    >
                                                        {entry ? (
                                                            <div
                                                                onClick={(e) => {
                                                                    if (selectedBrush) return; // Let handleCellClick take over
                                                                    e.stopPropagation();
                                                                    openAssignDialog(day.id, period.id, entry);
                                                                }}
                                                                className="h-full w-full bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md p-2 cursor-pointer transition-all hover:shadow-sm flex flex-col justify-center"
                                                            >
                                                                <div className="font-semibold text-primary line-clamp-1">{entry.subjects?.name || 'N/A'}</div>
                                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.users?.full_name}</div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    if (selectedBrush) return;
                                                                    e.stopPropagation();
                                                                    openAssignDialog(day.id, period.id);
                                                                }}
                                                                className="h-full w-full border-2 border-dashed border-transparent hover:border-border rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-all hover:bg-muted/30"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {dialogConfig && (
                            <AssignPeriodDialog
                                open={dialogConfig.open}
                                onOpenChange={(open) => setDialogConfig(prev => prev ? { ...prev, open } : null)}
                                classId={classRecord.id}
                                periodId={dialogConfig.periodId}
                                dayOfWeek={dialogConfig.dayOfWeek}
                                academicYear={academicYear}
                                existingEntry={dialogConfig.existingEntry}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
