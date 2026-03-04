'use client';

import { useState } from 'react';
import { useGetPeriods } from '../hooks/use-get-periods';
import { type TimetableWithDetails } from '../schemas/timetable.schema';
import { AssignPeriodDialog } from './assign-period-dialog';

import { Plus } from 'lucide-react';

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
];

interface ClassTimetableGridProps {
    classId: string;
    academicYear: string;
    timetable: TimetableWithDetails[];
}

export function ClassTimetableGrid({ classId, academicYear, timetable }: ClassTimetableGridProps) {
    const { data: periods, isLoading: isPeriodsLoading } = useGetPeriods();
    const [dialogConfig, setDialogConfig] = useState<{
        open: boolean;
        periodId: string;
        dayOfWeek: number;
        existingEntry?: TimetableWithDetails;
    } | null>(null);

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
        <div className="col-span-1 border rounded-xl overflow-hidden bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                            <th className="px-4 py-3 border-b border-r w-24 sticky left-0 bg-muted/40 z-10">Day</th>
                            {periods.map(period => (
                                <th key={period.id} className="px-4 py-3 border-b text-center min-w-[140px] max-w-[160px]">
                                    {period.name}
                                    <div className="font-normal opacity-70 lowercase mt-0.5 tracking-normal">
                                        {period.start_time.substring(0, 5)} - {period.end_time.substring(0, 5)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {DAYS.map((day) => (
                            <tr key={day.id} className="group hover:bg-muted/10 transition-colors">
                                <td className="px-4 py-3 border-r font-semibold sticky left-0 bg-card group-hover:bg-muted/10 z-10 transition-colors">
                                    {day.name}
                                </td>
                                {periods.map(period => {
                                    const cellKey = `${day.id}-${period.id}`;
                                    const entry = gridMap.get(cellKey);

                                    return (
                                        <td key={period.id} className="p-2 relative group/cell border-r last:border-r-0 align-top h-24">
                                            {entry ? (
                                                <div
                                                    onClick={() => openAssignDialog(day.id, period.id, entry)}
                                                    className="h-full w-full bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md p-2 cursor-pointer transition-all hover:shadow-sm flex flex-col justify-center"
                                                >
                                                    <div className="font-semibold text-primary line-clamp-1">{entry.subjects?.name}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.users?.full_name}</div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openAssignDialog(day.id, period.id)}
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
                    classId={classId}
                    periodId={dialogConfig.periodId}
                    dayOfWeek={dialogConfig.dayOfWeek}
                    academicYear={academicYear}
                    existingEntry={dialogConfig.existingEntry}
                    existingClassTimetable={timetable}
                />
            )}
        </div>
    );
}
