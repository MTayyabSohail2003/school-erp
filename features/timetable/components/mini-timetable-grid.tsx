'use client';

import { type TimetableWithDetails } from '../schemas/timetable.schema';
import { type Period } from '../api/periods.api';
import { useUpsertTimetable } from '../hooks/use-upsert-timetable';
import { useGetAllTimetable } from '../hooks/use-get-all-timetable';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Plus, Loader2 } from 'lucide-react';

const DAYS = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
];

export interface Brush {
    teacherId: string;
    subjectId: string;
    teacherName: string;
    subjectName: string;
}

interface MiniTimetableGridProps {
    classId: string;
    className: string;
    section: string;
    academicYear: string;
    periods: Period[];
    timetable: TimetableWithDetails[];
    brush: Brush | null;
}

export function MiniTimetableGrid({
    classId,
    className,
    section,
    academicYear,
    periods,
    timetable,
    brush,
}: MiniTimetableGridProps) {
    const upsert = useUpsertTimetable();
    const { data: allTimetable } = useGetAllTimetable(academicYear);
    const { data: allClasses } = useClasses();

    // O(1) lookup: "dayId-periodId" -> entry
    const gridMap = new Map<string, TimetableWithDetails>();
    timetable.forEach(e => gridMap.set(`${e.day_of_week}-${e.period_id}`, e));

    const handleCellClick = (periodId: string, dayId: number) => {
        if (!brush) return;

        // Guard: primary in-charge teacher
        const isPrimary = allClasses?.some(
            c => c.class_teacher_id === brush.teacherId && c.is_primary
        );
        if (isPrimary) {
            toast.error(`${brush.teacherName} is a Primary Class In-Charge.`);
            return;
        }

        // Guard: teacher already busy in another class at same slot
        const conflict = allTimetable?.some(
            e =>
                e.teacher_id === brush.teacherId &&
                e.period_id === periodId &&
                e.day_of_week === dayId &&
                e.class_id !== classId
        );
        if (conflict) {
            toast.error(`${brush.teacherName} is already scheduled in another class for this slot.`);
            return;
        }

        upsert.mutate(
            {
                class_id: classId,
                period_id: periodId,
                day_of_week: dayId,
                teacher_id: brush.teacherId,
                subject_id: brush.subjectId,
                academic_year: academicYear,
            },
            {
                onSuccess: () => toast.success(`${brush.subjectName} → ${className} ${DAYS.find(d => d.id === dayId)?.label}`),
                onError: (err: Error) => toast.error(err.message),
            }
        );
    };

    // All periods (assuming no breaks or handled on DB level)
    const teachingPeriods = periods;

    return (
        <div className="flex flex-col rounded-2xl border border-border/60 overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
            {/* Class header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary/[0.05] border-b border-border/50">
                <div>
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                        {className}
                    </span>
                    <span className="ml-1 text-[10px] text-muted-foreground font-medium">— {section}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
                    {timetable.length} slots
                </span>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse">
                    <thead>
                        <tr className="bg-muted/30">
                            <th className="px-2 py-1.5 text-left font-bold text-muted-foreground w-10 border-r border-border/40 sticky left-0 bg-muted/30 z-10">
                                Day
                            </th>
                            {teachingPeriods.map(p => (
                                <th
                                    key={p.id}
                                    className="px-1.5 py-1.5 font-bold text-muted-foreground text-center min-w-[80px] border-r border-border/30 last:border-r-0"
                                >
                                    <div className="text-[9px] leading-tight">{p.name}</div>
                                    <div className="text-[8px] opacity-50 font-normal">
                                        {p.start_time.substring(0, 5)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {DAYS.map(day => (
                            <tr key={day.id} className="group/row hover:bg-muted/5 transition-colors">
                                <td className="px-2 py-1 font-bold text-muted-foreground border-r border-border/40 sticky left-0 bg-card group-hover/row:bg-muted/10 z-10 transition-colors">
                                    {day.label}
                                </td>
                                {teachingPeriods.map(period => {
                                    const entry = gridMap.get(`${day.id}-${period.id}`);
                                    const isPending =
                                        upsert.isPending &&
                                        upsert.variables?.period_id === period.id &&
                                        upsert.variables?.day_of_week === day.id;

                                    return (
                                        <td
                                            key={period.id}
                                            className={cn(
                                                'p-1 border-r border-border/20 last:border-r-0 h-12 align-middle transition-colors',
                                                brush
                                                    ? 'cursor-copy hover:bg-primary/10 active:bg-primary/20'
                                                    : 'hover:bg-muted/10'
                                            )}
                                            onClick={() => handleCellClick(period.id, day.id)}
                                        >
                                            {isPending ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                                </div>
                                            ) : entry ? (
                                                <div className="h-full flex flex-col justify-center gap-0.5 px-1 rounded-md bg-primary/10 border border-primary/20">
                                                    <span className="font-semibold text-primary leading-tight line-clamp-1">
                                                        {entry.subjects?.name ?? '—'}
                                                    </span>
                                                    <span className="text-muted-foreground leading-tight line-clamp-1 text-[8px]">
                                                        {entry.users?.full_name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    'h-full flex items-center justify-center rounded-md border-2 border-dashed transition-all',
                                                    brush
                                                        ? 'border-primary/30 opacity-60 hover:opacity-100 hover:border-primary/60'
                                                        : 'border-transparent opacity-0 group-hover/row:opacity-40 border-border'
                                                )}>
                                                    <Plus className="h-3 w-3 text-muted-foreground" />
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
