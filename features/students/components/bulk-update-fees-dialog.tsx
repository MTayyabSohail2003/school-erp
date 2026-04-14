'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useStudents, studentKeys } from '@/features/students/hooks/use-students';
import { bulkUpdateClassFeesAction } from '../api/student-actions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Coins,
    Users,
    ArrowRight,
    AlertCircle,
    Loader2,
    ShieldCheck
} from 'lucide-react';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export function BulkUpdateFeesDialog() {
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: classes, isLoading: isClassesLoading } = useClasses();
    const { data: students } = useStudents({ status: 'ACTIVE' });

    const form = useForm({
        defaultValues: {
            class_id: '',
            new_fee: 0,
            update_structure: true,
        },
    });

    const watchedClassId = form.watch('class_id');
    const affectedStudents = React.useMemo(() => {
        if (!watchedClassId || !students) return 0;
        return students.filter(s => s.class_id === watchedClassId).length;
    }, [watchedClassId, students]);

    const selectedClassName = React.useMemo(() => {
        const cls = classes?.find(c => c.id === watchedClassId);
        return cls ? `${cls.name} ${cls.section}` : '';
    }, [watchedClassId, classes]);

    async function onSubmit(values: { class_id: string; new_fee: number; update_structure: boolean }) {
        if (affectedStudents === 0 && !values.update_structure) {
            toast.error("No students are in this class to update.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await bulkUpdateClassFeesAction(
                values.class_id,
                values.new_fee,
                values.update_structure
            );

            if (!res.success) throw new Error(res.error);

            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            setOpen(false);
            form.reset();
        } catch (error: Error | unknown) {
            toast.error((error as Error).message || "Failed to update fees");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/20 hover:bg-primary/5 font-bold shadow-sm rounded-lg">
                    <Coins className="w-4 h-4 mr-2 text-primary" />
                    Manage Class Fees
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-primary/5 p-8 border-b border-primary/10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Coins className="h-6 w-6 text-white" />
                        </div>
                        <DialogHeader className="p-0 space-y-0.5">
                            <DialogTitle className="text-2xl font-black tracking-tight text-primary">Class Fees</DialogTitle>
                            <DialogDescription className="text-primary/60 font-medium">Bulk recalibrate student tuition records.</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Impacted Students</p>
                                <p className="text-xl font-black text-primary">{affectedStudents}</p>
                            </div>
                        </div>
                        {watchedClassId && (
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 font-black tracking-tighter uppercase px-3 py-1">
                                {selectedClassName}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="p-8 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-5">
                                <FormField
                                    control={form.control}
                                    name="class_id"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Target Class Group</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-muted/30 font-bold focus:ring-primary/20">
                                                        <SelectValue placeholder={isClassesLoading ? "Loading..." : "Select Class"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-primary/10">
                                                    {classes?.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id} className="font-bold py-3">
                                                            Class {cls.name} <span className="text-muted-foreground ml-2">Section {cls.section}</span>
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
                                    name="new_fee"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">New Monthly Amount (PKR)</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 5000"
                                                        className="h-12 pl-11 rounded-xl border-primary/10 bg-muted/30 font-black text-lg focus:ring-primary/20 transition-all"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="update_structure"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border border-primary/10 bg-primary/5 p-4 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="h-5 w-5 rounded-md border-primary/20 data-[state=checked]:bg-primary"
                                                />
                                            </FormControl>
                                            <div className="space-y-0.5 leading-none">
                                                <FormLabel className="text-sm font-black text-primary uppercase tracking-tight">Sync Fee Structure</FormLabel>
                                                <p className="text-[10px] text-muted-foreground font-medium">Updates target class defaults for future registrations.</p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-2">
                                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                                    <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] leading-relaxed font-bold text-amber-800 uppercase tracking-tight">
                                        Action will overwrite custom discounts for <span className="text-xs underline">{affectedStudents} students</span>. This is a destructive write-back operation.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl bg-primary text-white font-black text-base uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                    disabled={isSubmitting || !watchedClassId}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Execute Fee Update
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
