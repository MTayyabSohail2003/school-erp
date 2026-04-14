'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, ArrowRight, GraduationCap, CheckCircle2 } from 'lucide-react';
import { promoteStudentsAction } from '../api/student-actions';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { promoteStudentsSchema, PromoteStudentsData } from '../schemas/student.schema';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { Class } from '@/features/classes/schemas/class.schema';
import { useStudentsByClass } from '../hooks/use-students-by-class';

export function PromoteStudentsDialog() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successSummary, setSuccessSummary] = useState<string | null>(null);

    const { data: classesData, isLoading: isLoadingClasses } = useClasses();
    const queryClient = useQueryClient();

    const form = useForm<PromoteStudentsData>({
        resolver: zodResolver(promoteStudentsSchema),
        defaultValues: {
            student_ids: [],
            source_class_id: '',
            destination_class_id: undefined,
            new_academic_year: (new Date().getFullYear() + 1).toString(),
            is_graduation: false,
        },
    });

    const sourceClassId = form.watch('source_class_id');
    const { data: studentsInClass } = useStudentsByClass(sourceClassId);
    const isGraduation = form.watch('is_graduation');

    const onSubmit: SubmitHandler<PromoteStudentsData> = async (values) => {
        const finalData = {
            ...values,
            student_ids: values.student_ids
        };

        if (finalData.student_ids.length === 0) {
            toast.error("No students found in the selected source class.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await promoteStudentsAction(finalData);
            if (!res.success) throw new Error(res.error);
            
            setSuccessSummary(res.message || "Operation successful");
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            
            setTimeout(() => {
                setOpen(false);
                setSuccessSummary(null);
                form.reset();
            }, 3000);
        } catch (error) {
            toast.error((error as Error).message || 'Promotion failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset();
        }
    };

    // Keep student_ids array synchronized with available students in the class
    // Automatically select all students initially when source class changes

    useEffect(() => {
        if (studentsInClass) {
            form.setValue('student_ids', studentsInClass.map(s => s.id));
        } else {
            form.setValue('student_ids', []);
        }
    }, [studentsInClass, form]);

    const classes = classesData || [];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Promote Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                {successSummary ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Promotion Complete!</h3>
                            <p className="text-sm text-muted-foreground px-6">{successSummary}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Promote Students</DialogTitle>
                            <DialogDescription>
                                Bulk migrate students to a new class or mark them as graduated. This will also update academic years and generate initial challans.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border border-dashed">
                                        <FormField
                                            control={form.control as any}
                                            name="is_graduation"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                                            <GraduationCap className="h-4 w-4 text-primary" /> Mark as Graduation Batch
                                                        </FormLabel>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control as any}
                                        name="new_academic_year"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Academic Year</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 2026" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                            <FormField
                                control={form.control as any}
                                name="source_class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Class</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger disabled={isLoadingClasses}>
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classes.map((cls: Class) => (
                                                    <SelectItem key={cls.id || 'new'} value={cls.id || ''}>
                                                        {cls.name} - Sec {cls.section}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!isGraduation && (
                                <>
                                    <ArrowRight className="h-5 w-5 mx-auto text-muted-foreground mt-8" />

                                    <FormField
                                        control={form.control as any}
                                        name="destination_class_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>To Class</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value || undefined}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger disabled={isLoadingClasses}>
                                                            <SelectValue placeholder="Select target" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {classes.filter(c => c.id !== sourceClassId).map((cls: Class) => (
                                                            <SelectItem key={cls.id || 'new'} value={cls.id || ''}>
                                                                {cls.name} - {cls.section}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </div>

                        {studentsInClass && studentsInClass.length > 0 && (
                            <div className="space-y-3">
                                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-center justify-between">
                                    <span className="text-xs font-medium text-primary uppercase tracking-tight">Batch Size:</span>
                                    <span className="text-sm font-bold">{form.watch('student_ids').length} / {studentsInClass.length} Selected</span>
                                </div>
                                <div className="border rounded-md">
                                    <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
                                        <Checkbox 
                                            checked={form.watch('student_ids').length === studentsInClass.length && studentsInClass.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    form.setValue('student_ids', studentsInClass.map(s => s.id));
                                                } else {
                                                    form.setValue('student_ids', []);
                                                }
                                            }}
                                        />
                                        <span className="text-sm font-semibold">Select / Deselect All</span>
                                    </div>
                                    <ScrollArea className="h-[200px]">
                                        <div className="p-3 space-y-3">
                                            {studentsInClass.map((student) => (
                                                <FormField
                                                    key={student.id}
                                                    control={form.control as any}
                                                    name="student_ids"
                                                    render={({ field }) => {
                                                        const isSelected = field.value?.includes(student.id);
                                                        return (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onCheckedChange={(checked) => {
                                                                            const current = field.value || [];
                                                                            if (checked) {
                                                                                field.onChange([...current, student.id]);
                                                                            } else {
                                                                                field.onChange(current.filter((id: string) => id !== student.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal cursor-pointer text-sm flex-1">
                                                                    {student.full_name} <span className="text-muted-foreground">(Roll No: {student.roll_number})</span>
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        )}


                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !sourceClassId} className="min-w-[140px]">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    isGraduation ? 'Graduate Batch' : 'Confirm Promotion'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
                </>
                )}
            </DialogContent>
        </Dialog>
    );
}
