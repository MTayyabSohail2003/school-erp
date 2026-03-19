'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useClassSubjects } from '@/features/subjects/hooks/use-class-subjects';
import { useUpsertTimetable } from '../hooks/use-upsert-timetable';
import { useDeleteTimetable } from '../hooks/use-delete-timetable';
import { useGetAllTimetable } from '../hooks/use-get-all-timetable';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BookOpen, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}: AssignPeriodDialogProps) {
    const { data: staffList, isLoading: isStaffLoading } = useGetStaff();
    const { data: subjectsList, isLoading: isSubjectsLoading } = useClassSubjects(classId);
    const { data: allClasses } = useClasses();
    const { data: allTimetable } = useGetAllTimetable(academicYear);
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
        if (selectedTeacherId && periodId && dayOfWeek && allTimetable && allClasses) {
            // 1. Check if teacher is a Primary In-Charge (busy 100%)
            const isPrimaryInCharge = allClasses.some(c => c.class_teacher_id === selectedTeacherId && c.is_primary);
            if (isPrimaryInCharge) {
                setConflictWarning('Error: This teacher is a Primary Class In-Charge (Available for their class only).');
                return;
            }

            // 2. Check for specific period conflict in any class
            const hasSlotConflict = allTimetable.some(entry => 
                entry.teacher_id === selectedTeacherId && 
                entry.period_id === periodId && 
                entry.day_of_week === dayOfWeek &&
                entry.class_id !== classId &&
                entry.id !== existingEntry?.id
            );

            if (hasSlotConflict) {
                setConflictWarning('Error: This teacher is already scheduled for this period in another class.');
            } else {
                setConflictWarning(null);
            }
        }
    }, [selectedTeacherId, periodId, dayOfWeek, existingEntry, classId, allTimetable, allClasses, academicYear]);

    const onSubmit = (values: AssignFormData) => {
        // Prevent submission if there's a hard error warning
        if (conflictWarning?.startsWith('Error:')) {
            toast.error(conflictWarning);
            return;
        }

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
                    const err = error as Error;
                    if (err.message.includes('no_teacher_conflict')) {
                        toast.error('Conflict: This teacher is already assigned elsewhere during this period.');
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                        <FormField
                            control={form.control}
                            name="subject_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <BookOpen className="h-3 w-3 text-primary" />
                                        Subject
                                    </FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value || ''}
                                        disabled={isSubjectsLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full h-11 border bg-background/50 rounded-xl font-semibold text-sm focus:ring-primary/20 transition-all duration-300">
                                                <SelectValue placeholder="Select subject..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                            {(subjectsList as Subject[])?.map((s) => (
                                                <SelectItem key={s.id} value={s.id || ''} className="text-sm font-medium focus:bg-primary/5 focus:text-primary rounded-lg mx-1 my-0.5">
                                                    {s.name} <span className="text-[10px] opacity-40 font-bold ml-2">[{s.code}]</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="teacher_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <User className="h-3 w-3 text-primary" />
                                        Teacher
                                    </FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value || ''}
                                        disabled={isStaffLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full h-11 border bg-background/50 rounded-xl font-semibold text-sm focus:ring-primary/20 transition-all duration-300">
                                                <SelectValue placeholder="Select teacher..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                            {staffList?.map((t) => (
                                                <SelectItem key={t.id} value={t.id || ''} className="text-sm font-medium focus:bg-primary/5 focus:text-primary rounded-lg mx-1 my-0.5">
                                                    {t.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />

                        {conflictWarning && (
                            <div className={cn(
                                "p-3 rounded-xl border flex gap-3 items-start transition-all duration-300 animate-in fade-in slide-in-from-top-2",
                                conflictWarning.startsWith('Error') 
                                    ? "bg-rose-500/5 border-rose-500/20 text-rose-600" 
                                    : "bg-amber-500/5 border-amber-500/20 text-amber-600"
                            )}>
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <p className="text-[11px] font-bold leading-relaxed">{conflictWarning}</p>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 gap-3">
                            {existingEntry ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 px-4 border-rose-500/20 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 hover:border-rose-500/30 rounded-xl font-bold transition-all duration-300"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending || upsertMutation.isPending}
                                >
                                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    <span className="hidden sm:inline ml-2">Remove Record</span>
                                </Button>
                            ) : <div />}

                            <div className="flex gap-2 flex-1 sm:flex-initial">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="h-11 flex-1 sm:px-6 rounded-xl font-bold hover:bg-muted/50 border-input/50 transition-all duration-300"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="h-11 flex-1 sm:px-8 rounded-xl font-bold bg-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                                    disabled={upsertMutation.isPending || deleteMutation.isPending || !!conflictWarning?.startsWith('Error')}
                                >
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
