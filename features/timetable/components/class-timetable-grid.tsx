'use client';

import { useState } from 'react';
import { useGetPeriods } from '../hooks/use-get-periods';
import { useBulkUpsertTimetable } from '../hooks/use-bulk-upsert-timetable';
import { type TimetableWithDetails } from '../schemas/timetable.schema';
import { type ClassRecord } from '@/features/classes/api/classes.api';
import { AssignPeriodDialog } from './assign-period-dialog';
import { toast } from 'sonner';

import { Plus, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

    const isPrimary = classRecord.name.toLowerCase().includes('nursery') || 
                      ['prep', '1', '2', '3', '4'].some(grade => classRecord.name.toLowerCase().includes(grade));

    const [dialogConfig, setDialogConfig] = useState<{
        open: boolean;
        periodId: string;
        dayOfWeek: number;
        existingEntry?: TimetableWithDetails;
    } | null>(null);

    const handleQuickFill = () => {
        if (!classRecord.class_teacher_id) {
            toast.error('No class teacher assigned to this class. Please edit class settings first.');
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

        bulkUpsert.mutate(newEntries as any, {
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
            {isPrimary && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-primary/[0.08] to-transparent border border-primary/20 p-5 rounded-2xl gap-4 shadow-[0_2px_10px_rgba(var(--primary),0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-inner">
                            <Zap className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-bold tracking-tight">Rapid Schedule: Primary Mode</p>
                            <p className="text-[11px] text-muted-foreground leading-snug">This class usually follows a class teacher setup. Use the quick fill button to populate the entire matrix with one click.</p>
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
            )}

            <div className="relative border rounded-xl overflow-hidden bg-card shadow-sm w-full max-w-full">
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
                        existingClassTimetable={timetable}
                    />
                )}
            </div>
        </div>
    );
}
