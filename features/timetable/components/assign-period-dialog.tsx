'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { useGetSubjects } from '@/features/subjects/hooks/use-get-subjects';
import { useUpsertTimetable } from '../hooks/use-upsert-timetable';
import { useDeleteTimetable } from '../hooks/use-delete-timetable';
import { timetableValidation } from '../utils/validation.utils';
import { type TimetableWithDetails } from '../schemas/timetable.schema';
import { type Subject } from '@/features/subjects/api/subjects.api';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const assignSchema = z.object({
    teacher_id: z.string().uuid('Please select a teacher'),
    subject_id: z.string().uuid('Please select a subject'),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignPeriodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: string;
    periodId: string;
    dayOfWeek: number;
    academicYear: string;
    existingEntry?: TimetableWithDetails;
    existingClassTimetable: TimetableWithDetails[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AssignPeriodDialog({
    open,
    onOpenChange,
    classId,
    periodId,
    dayOfWeek,
    academicYear,
    existingEntry,
    existingClassTimetable,
}: AssignPeriodDialogProps) {
    const { data: staffList, isLoading: isStaffLoading } = useGetStaff();
    const { data: subjectsList, isLoading: isSubjectsLoading } = useGetSubjects();
    const upsertMutation = useUpsertTimetable();
    const deleteMutation = useDeleteTimetable();

    const [conflictWarning, setConflictWarning] = useState<string | null>(null);

    const form = useForm<AssignFormData>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            teacher_id: '',
            subject_id: '',
        },
    });

    // Reset when opened or existing changes
    useEffect(() => {
        if (open) {
            form.reset({
                teacher_id: existingEntry?.teacher_id || '',
                subject_id: existingEntry?.subject_id || '',
            });
            setConflictWarning(null);
        }
    }, [open, existingEntry, form]);

    const selectedTeacherId = form.watch('teacher_id');

    // Inline Conflict Checker for Teacher
    useEffect(() => {
        if (selectedTeacherId && periodId && dayOfWeek) {
            const hasConflict = timetableValidation.hasTeacherConflict(
                {
                    id: existingEntry?.id,
                    class_id: classId,
                    teacher_id: selectedTeacherId,
                    subject_id: form.getValues('subject_id') || '',
                    period_id: periodId,
                    day_of_week: dayOfWeek,
                    academic_year: academicYear
                },
                existingClassTimetable // Normally we'd cross-check global timetable, but DB will catch it.
                // For a robust app, you might want to fetch that teacher's specific timetable to check here,
                // but for now, the UI relies on DB constraint fallback for cross-class teacher conflicts if not in memory.
            );
            if (hasConflict) {
                setConflictWarning('Warning: This teacher might already be scheduled for this period.');
            } else {
                setConflictWarning(null);
            }
        }
    }, [selectedTeacherId, periodId, dayOfWeek, existingEntry, classId, form, existingClassTimetable, academicYear]);

    const onSubmit = (values: AssignFormData) => {
        upsertMutation.mutate(
            {
                id: existingEntry?.id,
                class_id: classId,
                teacher_id: values.teacher_id,
                subject_id: values.subject_id,
                period_id: periodId,
                day_of_week: dayOfWeek,
                academic_year: academicYear,
            },
            {
                onSuccess: () => {
                    toast.success('Period assigned successfully.');
                    onOpenChange(false);
                },
                onError: (error: unknown) => {
                    // This is where PostgreSQL composite unique hooks kick in
                    const err = error as Error;
                    if (err.message.includes('no_teacher_conflict')) {
                        toast.error('Conflict: This teacher is already assigned to a different class during this period.');
                    } else if (err.message.includes('no_class_conflict')) {
                        toast.error('Conflict: This class already has an assignment for this period.');
                    } else {
                        toast.error(err.message || 'Failed to assign period.');
                    }
                },
            }
        );
    };

    const handleDelete = () => {
        if (!existingEntry?.id) return;
        deleteMutation.mutate(
            { id: existingEntry.id },
            {
                onSuccess: () => {
                    toast.success('Period assignment removed.');
                    onOpenChange(false);
                },
                onError: (error: unknown) => {
                    toast.error((error as Error).message || 'Failed to remove assignment.');
                },
            }
        );
    };

    const dayName = DAYS[dayOfWeek - 1];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Period ({dayName})</DialogTitle>
                    <DialogDescription>
                        Assign a teacher and subject to this class period. Uniqueness checks apply.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="subject_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                            disabled={isSubjectsLoading}
                                        >
                                            <option value="" disabled>Select subject...</option>
                                            {(subjectsList as Subject[])?.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.code || 'N/A'})
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="teacher_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teacher</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                            disabled={isStaffLoading}
                                        >
                                            <option value="" disabled>Select teacher...</option>
                                            {staffList?.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {conflictWarning && (
                            <Badge variant="destructive" className="w-full justify-center bg-amber-500/15 text-amber-600 border-amber-500/30 font-medium py-1.5 px-3">
                                {conflictWarning}
                            </Badge>
                        )}

                        <div className="flex justify-between items-center pt-4">
                            {existingEntry ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending || upsertMutation.isPending}
                                >
                                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Remove
                                </Button>
                            ) : <div></div>}

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={upsertMutation.isPending || deleteMutation.isPending}>
                                    {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
