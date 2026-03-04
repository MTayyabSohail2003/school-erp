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
