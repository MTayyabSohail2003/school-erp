'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
    Coins,
    Calendar,
    Banknote,
    Landmark,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    MessageSquare,
    Loader2,
    Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRecordPayout } from '../api/use-payroll-ledger';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PayStaffModal({
    staff,
    open,
    onOpenChange,
    monthYear
}: {
    staff: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    monthYear: string;
}) {
    const recordPayout = useRecordPayout();

    const form = useForm({
        defaultValues: {
            bonus: staff?.ledger?.bonus || 0,
            bonus_notes: staff?.ledger?.bonus_notes || '',
            fine: staff?.ledger?.fine || 0,
            fine_notes: staff?.ledger?.fine_notes || '',
            paid_notes: staff?.ledger?.paid_notes || '',
            amount_paid: staff?.ledger?.net_paid || (staff?.base_salary + (staff?.historicalArrears || 0)),
            method: staff?.ledger?.method || 'CASH'
        }
    });

    React.useEffect(() => {
        if (staff) {
            const initialNet = staff.base_salary + staff.historicalArrears + (staff.ledger?.bonus || 0) - (staff.ledger?.fine || 0);
            form.reset({
                bonus: staff.ledger?.bonus || 0,
                bonus_notes: staff.ledger?.bonus_notes || '',
                fine: staff.ledger?.fine || 0,
                fine_notes: staff.ledger?.fine_notes || '',
                paid_notes: staff.ledger?.paid_notes || '',
                amount_paid: staff.ledger?.net_paid || Math.max(0, initialNet),
                method: staff.ledger?.method || 'CASH'
            });
        }
    }, [staff, form]);

    const watchedBonus = form.watch('bonus');
    const watchedFine = form.watch('fine');
    const watchedAmountPaid = form.watch('amount_paid');

    const netLiability = React.useMemo(() => {
        if (!staff) return 0;
        return staff.base_salary + staff.historicalArrears + Number(watchedBonus || 0) - Number(watchedFine || 0);
    }, [staff, watchedBonus, watchedFine]);

    // Smart Sync: Only update amount_paid if it was previously equal to netLiability (Full Payment mode)
    // This allows users to do partial payments without being "reset" every time they change a bonus
    const prevLiabilityRef = React.useRef(netLiability);

    React.useEffect(() => {
        const isCurrentlyFullPayment = Number(watchedAmountPaid) === prevLiabilityRef.current;
        if (isCurrentlyFullPayment || Number(watchedAmountPaid) === 0) {
            form.setValue('amount_paid', netLiability);
        }
        prevLiabilityRef.current = netLiability;
    }, [netLiability, form]); // Only trigger on liability changes (bonus/fine)

    const remaining = Math.max(0, netLiability - Number(watchedAmountPaid || 0));

    const onSubmit = async (values: any) => {
        try {
            let status: 'PAID' | 'PARTIAL' | 'PENDING' = 'PAID';
            if (values.amount_paid <= 0) status = 'PENDING';
            else if (values.amount_paid < netLiability) status = 'PARTIAL';
            else if (values.amount_paid > netLiability) {
                toast.error(`Overpayment Error: You cannot pay more than the total liability (Rs. ${netLiability.toLocaleString()}). Add a Bonus if extra payment is intended.`);
                return;
            }

            if (status === 'PARTIAL' && !values.paid_notes?.trim()) {
                toast.error("Validation Error: Please provide a reason for the partial payment.");
                form.setError('paid_notes', { type: 'manual', message: 'Reason is required for partial payments.' });
                return;
            }

            await recordPayout.mutateAsync({
                teacher_id: staff.id,
                month_year: monthYear,
                base_salary: staff.base_salary,
                arrears: staff.historicalArrears,
                bonus: Number(values.bonus),
                bonus_notes: values.bonus_notes,
                fine: Number(values.fine),
                fine_notes: values.fine_notes,
                paid_notes: values.paid_notes,
                net_paid: Number(values.amount_paid),
                method: values.method,
                status
            });

            toast.success(`Salary processed for ${staff.full_name}`);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (!staff) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[98vw] sm:max-w-4xl p-0 border-none shadow-2xl rounded-[1.8rem] sm:rounded-[2.2rem] bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[90vh] gap-0">
                <div className="bg-emerald-500/5 p-4 sm:p-5 border-b border-emerald-500/10 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <ImagePreviewDialog
                                src={staff.avatar_url}
                                title={staff.full_name}
                                description={`Staff Profile - ${format(parseISO(`${monthYear}-01`), 'MMMM yyyy')}`}
                            >
                                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-emerald-500/20 transition-transform hover:scale-105 duration-300 shadow-xl shadow-emerald-500/10 cursor-zoom-in shrink-0">
                                    <AvatarImage src={staff.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-black text-xs sm:text-lg">
                                        {staff.full_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </ImagePreviewDialog>
                            <DialogHeader className="p-0 space-y-0 text-left">
                                <DialogTitle className="text-lg sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">Process Payout</DialogTitle>
                                <DialogDescription className="text-emerald-500/60 font-black flex items-center gap-1.5 text-[10px] sm:text-xs">
                                    <Calendar className="w-3 h-3" />
                                    {format(parseISO(`${monthYear}-01`), 'MMM yyyy')} • {staff.full_name}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex flex-row items-center sm:text-right gap-4 justify-between sm:justify-end">
                            {staff.historicalArrears > 0 && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2 animate-pulse text-left h-fit shrink-0">
                                    <Landmark className="w-4 h-4 text-orange-600" />
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-orange-600/60 leading-none mb-0.5">Unpaid Arrears</p>
                                        <p className="text-xs font-black text-orange-600 leading-none">Rs. {staff.historicalArrears.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-0 text-right shrink-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/40">Payable Amount</p>
                                <p className="text-2xl sm:text-4xl font-black text-emerald-600 tracking-tighter leading-none mt-1">
                                    <span className="text-lg sm:text-xl mr-1">Rs.</span>
                                    <span className="tabular-nums">{netLiability.toLocaleString()}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                        <div className="w-full flex-1 overflow-y-auto min-h-0 pb-6 pt-4 sm:pt-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-emerald-500/20 [&::-webkit-scrollbar-track]:bg-transparent">
                            <div className="space-y-3 sm:space-y-4 px-4 sm:px-8">
                                {/* Professional Financial Breakdown 📊 */}
                                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 flex items-center gap-2">
                                        <Coins className="w-3 h-3" /> Liability Breakdown
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-muted-foreground/70">Base Monthly Salary</span>
                                            <span className="font-black text-foreground">Rs. {staff.base_salary.toLocaleString()}</span>
                                        </div>
                                        {staff.historicalArrears > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-muted-foreground/70 flex items-center gap-1.5">
                                                    Previous Month Arrears <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                </span>
                                                <span className="font-black text-orange-600">Rs. {staff.historicalArrears.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {Number(watchedBonus) > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-muted-foreground/70">Added Bonus</span>
                                                <span className="font-black text-emerald-600">+ Rs. {Number(watchedBonus).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {Number(watchedFine) > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-muted-foreground/70">Salary Deduction (Fine)</span>
                                                <span className="font-black text-red-600">- Rs. {Number(watchedFine).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-emerald-500/10 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Net Liability</span>
                                            <span className="text-lg font-black text-emerald-600">Rs. {netLiability.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {remaining > 0 && (
                                        <div className="pt-2 border-t border-dashed border-orange-500/20 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-500">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> Balance After Payment
                                            </span>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-orange-600">Rs. {remaining.toLocaleString()}</span>
                                                <p className="text-[8px] font-bold text-orange-500/60 leading-none">To be paid later</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bonus"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <TrendingUp className="w-3 h-3 text-emerald-500" /> Monthly Bonus
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} className="h-10 sm:h-12 rounded-xl bg-muted/30 border-primary/5 font-bold focus:ring-primary/20" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fine"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3 text-red-500" /> Salary Fine
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} className="h-10 sm:h-12 rounded-xl bg-muted/30 border-primary/5 font-bold focus:ring-primary/20" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {Number(form.watch('bonus')) > 0 && (
                                    <FormField
                                        control={form.control}
                                        name="bonus_notes"
                                        render={({ field }) => (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                <FormItem className="space-y-1.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                                    <FormLabel className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                        <TrendingUp className="w-3 h-3" /> Reason for Bonus
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} placeholder="Why is this bonus given?" className="resize-none h-12 sm:h-16 bg-transparent border-none p-0 px-1 focus-visible:ring-0 font-medium text-xs sm:text-sm" />
                                                    </FormControl>
                                                </FormItem>
                                            </motion.div>
                                        )}
                                    />
                                )}

                                {Number(watchedFine) > 0 && (
                                    <FormField
                                        control={form.control}
                                        name="fine_notes"
                                        render={({ field }) => (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                <FormItem className="space-y-1.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-500/5 border border-red-500/10">
                                                    <FormLabel className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-2">
                                                        <AlertCircle className="w-3 h-3" /> Reason for Fine
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} placeholder="Explain deduction..." className="resize-none h-12 sm:h-16 bg-transparent border-none p-0 px-1 focus-visible:ring-0 font-medium text-xs sm:text-sm" />
                                                    </FormControl>
                                                </FormItem>
                                            </motion.div>
                                        )}
                                    />
                                )}

                                {remaining > 0 && (
                                    <FormField
                                        control={form.control}
                                        name="paid_notes"
                                        render={({ field }) => (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                <FormItem className="space-y-1.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-orange-500/5 border border-orange-500/10">
                                                    <FormLabel className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                                        <AlertCircle className="w-3 h-3" /> Partial Payment Reason <span className="text-red-500 font-bold ml-1 text-sm leading-none">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} placeholder="Why is the full amount not being paid?" className="resize-none h-12 sm:h-16 bg-transparent border-none p-0 px-1 focus-visible:ring-0 font-medium text-xs sm:text-sm" />
                                                    </FormControl>
                                                </FormItem>
                                            </motion.div>
                                        )}
                                    />
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <FormField
                                        control={form.control}
                                        name="amount_paid"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                    <Banknote className="w-4 h-4" /> Amount Paying
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            className={`h-12 sm:h-14 pl-4 rounded-xl sm:rounded-2xl border-2 transition-all font-black text-lg sm:text-xl focus:ring-4 ${Number(watchedAmountPaid) > netLiability ? 'bg-red-500/10 border-red-500 text-red-600 focus:ring-red-500/20' : 'bg-primary/5 border-primary/20 text-primary focus:ring-primary/30'}`}
                                                        />
                                                        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                            <Button type="button" variant="ghost" size="sm" className="h-7 sm:h-8 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary" onClick={() => field.onChange(netLiability)}>Max</Button>
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                {Number(watchedAmountPaid) > netLiability && (
                                                    <p className="text-[8px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest mt-2 animate-pulse flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Overpayment limit reached
                                                    </p>
                                                )}
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="method"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Landmark className="w-3 h-3" /> Method
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-muted/50 border-primary/5 font-black text-[10px] sm:text-xs uppercase tracking-widest italic">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-primary/10">
                                                        <SelectItem value="CASH" className="font-bold py-3 text-xs">Cash In Hand</SelectItem>
                                                        <SelectItem value="BANK" className="font-bold py-3 text-xs">Bank Transfer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {remaining <= 0 && (
                                    <FormField
                                        control={form.control}
                                        name="paid_notes"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <MessageSquare className="w-3 h-3" /> Remarks
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Optional notes..." className="h-10 sm:h-12 rounded-xl bg-muted/30 border-primary/5 font-medium text-sm" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="p-3 sm:p-5 border-t border-border/10 bg-zinc-50 dark:bg-zinc-950 shrink-0">
                            <Button
                                type="submit"
                                disabled={recordPayout.isPending}
                                className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500 text-white font-black text-xs sm:text-base uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                            >
                                {recordPayout.isPending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                                        Release Payout
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>

        </Dialog>
    );
}
