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
    Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRecordPayout } from '../api/use-payroll-ledger';
import { toast } from 'sonner';

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

    const remaining = netLiability - Number(watchedAmountPaid || 0);

    const onSubmit = async (values: any) => {
        try {
            let status: 'PAID' | 'PARTIAL' | 'PENDING' = 'PAID';
            if (values.amount_paid <= 0) status = 'PENDING';
            else if (values.amount_paid < netLiability) status = 'PARTIAL';
            else if (values.amount_paid > netLiability) {
                toast.error(`Overpayment Error: You cannot pay more than the total liability (Rs. ${netLiability.toLocaleString()}). Add a Bonus if extra payment is intended.`);
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
            <DialogContent className="w-[96vw] sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 flex flex-col h-[92dvh] sm:h-auto sm:max-h-[90vh]">
                <div className="bg-emerald-500/5 p-5 sm:p-8 border-b border-emerald-500/10 shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 shrink-0">
                            <Coins className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <DialogHeader className="p-0 space-y-0.5 text-left">
                            <DialogTitle className="text-xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">Process Payout</DialogTitle>
                            <DialogDescription className="text-emerald-500/60 font-black flex items-center gap-2 text-[10px] sm:text-sm">
                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {format(parseISO(`${monthYear}-01`), 'MMMM yyyy')} • {staff.full_name}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-white dark:border-white/10">
                            <p className="text-[9px] sm:text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Total Liability</p>
                            <p className="text-xl sm:text-2xl font-black text-emerald-600">Rs. {netLiability.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-muted-foreground/60 mt-0.5 sm:mt-1 italic leading-none">Incl. Rs. {staff.historicalArrears.toLocaleString()} Arrears</p>
                        </div>
                        <div className={`rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all duration-500 ${remaining > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                            <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest mb-1 opacity-70">Remaining Debt</p>
                            <p className={`text-xl sm:text-2xl font-black ${remaining > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                Rs. {remaining.toLocaleString()}
                            </p>
                            <p className="text-[9px] font-bold opacity-60 mt-0.5 sm:mt-1 italic leading-none">
                                {remaining > 0 ? 'Will carry to next month' : 'Full settlement'}
                            </p>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
                        <ScrollArea className="flex-1 w-full h-full pb-6 pt-5">
                            <div className="space-y-5 sm:space-y-6 px-5 sm:px-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <FormField
                                    control={form.control}
                                    name="bonus"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" /> Monthly Bonus
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="h-12 rounded-xl bg-muted/30 border-primary/5 font-bold focus:ring-primary/20" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fine"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3 text-red-500" /> Salary Fine
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="h-12 rounded-xl bg-muted/30 border-primary/5 font-bold focus:ring-primary/20" />
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
                                            <FormItem className="space-y-1.5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                    <TrendingUp className="w-3 h-3" /> Reason for Bonus
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Why is this bonus being given? (e.g. Performance)" className="resize-none h-16 bg-transparent border-none p-3 focus-visible:ring-0 font-medium text-sm" />
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
                                            <FormItem className="space-y-1.5 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" /> Reason for Fine
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Explain why salary was deducted..." className="resize-none h-16 bg-transparent border-none p-3 focus-visible:ring-0 font-medium text-sm" />
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
                                            <FormItem className="space-y-1.5 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" /> Reason for Partial Payment
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Why is the full amount not being paid? (e.g. Balance pending)" className="resize-none h-16 bg-transparent border-none p-3 focus-visible:ring-0 font-medium text-sm" />
                                                </FormControl>
                                            </FormItem>
                                        </motion.div>
                                    )}
                                />
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-end">
                                <FormField
                                    control={form.control}
                                    name="amount_paid"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <Banknote className="w-4 h-4" /> Amount Paying
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input 
                                                        type="number" 
                                                        {...field} 
                                                        className={`h-14 pl-4 rounded-2xl border-2 transition-all font-black text-xl focus:ring-4 ${Number(watchedAmountPaid) > netLiability ? 'bg-red-500/10 border-red-500 text-red-600 focus:ring-red-500/20' : 'bg-primary/5 border-primary/20 text-primary focus:ring-primary/30'}`} 
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Button type="button" variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary" onClick={() => field.onChange(netLiability)}>Max</Button>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            {Number(watchedAmountPaid) > netLiability && (
                                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-2 animate-pulse flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Overpayment limited to Rs. {netLiability.toLocaleString()}
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
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Landmark className="w-3 h-3" /> Method
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-primary/5 font-black text-xs uppercase tracking-widest italic">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-primary/10">
                                                    <SelectItem value="CASH" className="font-bold py-3">Cash In Hand</SelectItem>
                                                    <SelectItem value="BANK" className="font-bold py-3">Bank Transfer</SelectItem>
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
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <MessageSquare className="w-3 h-3" /> Payout Remarks
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Optional notes for this payout..." className="h-12 rounded-xl bg-muted/30 border-primary/5 font-medium" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}
                            </div>
                        </ScrollArea>
                        <div className="p-4 sm:p-6 border-t bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shrink-0">
                            <Button
                                type="submit"
                                disabled={recordPayout.isPending}
                                className="w-full h-12 sm:h-16 rounded-xl sm:rounded-3xl bg-emerald-500 text-white font-black text-xs sm:text-lg uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                            >
                                {recordPayout.isPending ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        Release Payout
                                    </div>
                                )}
                            </Button>
                            <p className="text-[9px] text-center mt-4 font-black text-muted-foreground/40 uppercase tracking-widest">
                                Secure transaction recorded with full audit logs
                            </p>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
