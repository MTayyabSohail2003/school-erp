'use client';

import { useGetPeriods } from '../hooks/use-get-periods';
import { type TimetableWithDetails } from '../schemas/timetable.schema';

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
];

interface TeacherTimetableGridProps {
    timetable: TimetableWithDetails[];
}

export function TeacherTimetableGrid({ timetable }: TeacherTimetableGridProps) {
    const { data: periods, isLoading: isPeriodsLoading } = useGetPeriods();

    if (isPeriodsLoading) return <div className="h-64 flex items-center justify-center border rounded-xl bg-muted/20 animate-pulse text-sm text-muted-foreground">Loading teacher matrix...</div>;
    if (!periods || periods.length === 0) return <div className="p-8 text-center text-muted-foreground border rounded-xl">No periods defined in the system.</div>;

    const gridMap = new Map<string, TimetableWithDetails>();
    timetable.forEach(entry => {
        gridMap.set(`${entry.day_of_week}-${entry.period_id}`, entry);
    });

    return (
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
                                        <td key={period.id} className="p-2 relative border-r last:border-r-0 align-top h-24">
                                            {entry ? (
                                                <div className="h-full w-full bg-indigo-500/10 border border-indigo-500/20 rounded-md p-2 flex flex-col justify-center">
                                                    <div className="font-semibold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                                                        Class {entry.classes?.name}-{entry.classes?.section}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.subjects?.name}</div>
                                                </div>
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 text-xs italic">
                                                    Free
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
