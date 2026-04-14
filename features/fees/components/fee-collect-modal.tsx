'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Banknote, Landmark, CheckCircle2, AlertCircle, MessageSquare, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useCollectFee } from '../../finance/api/use-fees-dashboard';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

export interface DashboardChallan {
    id: string;
    student_id?: string;
    amount_due: number;
    paid_amount: number;
    status: string;
    month_year: string;
    arrears?: number;
    fines?: number;
    discount?: number;
    paid_notes?: string | null;
    fine_notes?: string | null;
    arrears_note?: string | null;
    students?: {
        full_name: string;
        roll_number: string;
        classes?: { name: string; section: string; };
    }
}

export function FeeCollectModal({ challan, open, onOpenChange }: { challan: DashboardChallan | null, open: boolean, onOpenChange: (o: boolean) => void }) {
    const totalOutstanding = (Number(challan?.amount_due || 0) + Number(challan?.arrears || 0) + Number(challan?.fines || 0)) - (Number(challan?.paid_amount || 0) + Number(challan?.discount || 0));

    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'ONLINE'>('CASH');
    const [paidAmount, setPaidAmount] = useState<number>(challan ? totalOutstanding : 0);
    const [fines, setFines] = useState<number>(challan?.fines || 0);
    const [discount, setDiscount] = useState<number>(challan?.discount || 0);
    const [paidNotes, setPaidNotes] = useState<string>(challan?.paid_notes || '');
    const [fineNotes, setFineNotes] = useState<string>(challan?.fine_notes || '');

    // Mutation
    const { mutateAsync: collectFee, isPending } = useCollectFee();

    if (!challan) return null;

    const remainingToCollect = (Number(challan.amount_due) + Number(challan.arrears || 0) - Number(challan.paid_amount || 0));
    const currentTotalPayable = remainingToCollect + fines - discount;
    const isPartial = paidAmount > 0 && paidAmount < currentTotalPayable;

    const handleConfirm = async () => {
        if (isPartial && !paidNotes.trim()) {
            toast.error('Please provide a reason for partial payment');
            return;
        }

        try {
            await collectFee({
                id: challan.id,
                currentPaid: Number(challan.paid_amount || 0),
                amount: paidAmount,
                method: paymentMethod,
                totalDue: Number(challan.amount_due),
                studentId: challan.student_id as string,
                monthYear: challan.month_year,
                extraData: {
                    fines,
                    discount,
                    paidNotes,
                    fineNotes,
                    arrears: challan.arrears || 0
                }
            });
            toast.success(isPartial ? 'Partial payment recorded' : 'Full payment collected');
            onOpenChange(false);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to collect fee');
        }
    };

    const monthlyFee = Number(challan.amount_due);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl max-h-[92vh] flex flex-col">
                <div className="bg-primary p-4 sm:p-6 sm:py-8 text-primary-foreground relative overflow-hidden shrink-0">
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 h-32 w-32 bg-black/10 rounded-full blur-2xl" />

                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                <Banknote className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-white leading-none mb-1">Fee Collection</DialogTitle>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-primary-foreground/70 font-bold text-sm uppercase tracking-widest">{challan.month_year} Session</span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="mt-8 flex justify-between items-end relative z-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Outstanding Balance</p>
                            <p className="text-2xl sm:text-4xl font-black tracking-tighter">Rs. {currentTotalPayable.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                            {paidAmount >= currentTotalPayable ? 'Ready to Close' : 'Partial Payment'}
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        {/* Student Badge Card */}
                        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border-2 border-primary/20 shadow-inner">
                                    {challan.students?.full_name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-sm tracking-tight">{challan.students?.full_name}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{challan.students?.classes?.name} — {challan.students?.classes?.section}</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border-2 border-primary/20 text-[10px] font-black text-primary uppercase shadow-sm">
                                {challan.students?.roll_number}
                            </div>
                        </div>

                        {/* Breakdown vs Collection Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: Summary */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Plus className="h-3 w-3" /> Billing Matrix
                                </h4>
                                <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-dashed text-zinc-900 dark:text-zinc-100">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Monthly Base</span>
                                        <span>Rs. {monthlyFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-orange-500">Old Arrears</span>
                                        <span className="text-orange-600">+ Rs. {(challan.arrears || 0).toLocaleString()}</span>
                                    </div>
                                    {challan.arrears > 0 && challan.arrears_note && (
                                        <div className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 flex items-start gap-2">
                                            <Info className="h-3 w-3 text-amber-600 mt-0.5" />
                                            <span className="text-[9px] font-medium text-amber-700 italic leading-relaxed">
                                                Prev. Note: "{challan.arrears_note}"
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-blue-500 font-black">Late Fees / Fines</span>
                                        <span className="text-blue-600">+ Rs. {fines.toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-emerald-500 underline decoration-dotted underline-offset-4">Staff Waiver</span>
                                            <span className="text-emerald-600">- Rs. {discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <Separator className="bg-border/50" />
                                    <div className="flex justify-between text-sm font-black pt-1">
                                        <span>Total Balance</span>
                                        <span className="text-primary tracking-tight">Rs. {currentTotalPayable.toLocaleString()}</span>
                                    </div>
                                </div>

                                {currentTotalPayable - paidAmount > 0 && (
                                    <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex items-start gap-3">
                                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                        <div className="flex flex-col text-zinc-900 dark:text-zinc-100">
                                            <span className="text-[10px] font-bold text-amber-700 uppercase leading-none mb-1">Debt Warning</span>
                                            <span className="text-xs font-black text-amber-900/80 dark:text-amber-400">Rs. {(currentTotalPayable - paidAmount).toLocaleString()} will be flagged as debt</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Inputs */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Receive Amount (Rs.)</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs transition-colors group-focus-within:text-primary">Rs.</div>
                                        <Input
                                            type="number"
                                            value={paidAmount}
                                            onChange={(e) => setPaidAmount(Number(e.target.value))}
                                            className="h-11 pl-10 border-2 font-black rounded-xl focus-visible:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Add Fine</Label>
                                        <Input
                                            type="number"
                                            value={fines}
                                            onChange={(e) => setFines(Number(e.target.value))}
                                            className="h-10 border-2 font-black rounded-xl focus-visible:ring-blue-500/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Waiver</Label>
                                        <Input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                            className="h-10 border-2 font-black rounded-xl focus-visible:ring-emerald-500/20 text-emerald-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Method</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                            className={`flex-1 h-10 rounded-xl gap-2 font-black text-xs ${paymentMethod === 'CASH' ? 'ring-2 ring-primary/20 shadow-md' : ''}`}
                                            onClick={() => setPaymentMethod('CASH')}
                                        >
                                            <Banknote className="h-4 w-4" /> Cash
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'BANK' ? 'default' : 'outline'}
                                            className={`flex-1 h-10 rounded-xl gap-2 font-black text-xs ${paymentMethod === 'BANK' ? 'ring-2 ring-primary/20 shadow-md' : ''}`}
                                            onClick={() => setPaymentMethod('BANK')}
                                        >
                                            <Landmark className="h-4 w-4" /> Bank
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fine Reason - Only show if fines > 0 */}
                        {fines > 0 && (
                            <div className="space-y-2 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 group transition-colors">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 ml-1 flex items-center gap-2">
                                    <AlertCircle className="h-3 w-3" /> Reason for Fine (Required)
                                </Label>
                                <Input 
                                    placeholder="e.g., Late submission, damaged equipment..."
                                    className="h-8 bg-transparent border-none focus-visible:ring-0 p-3 text-sm font-medium italic placeholder:text-blue-300"
                                    value={fineNotes}
                                    onChange={(e) => setFineNotes(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Reason / Notes */}
                        <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-dashed group transition-colors hover:border-primary/30">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" /> {isPartial ? 'Payment Recovery Note (Mandatory)' : 'Administrative Remarks (Optional)'}
                            </Label>
                            <Textarea
                                placeholder={isPartial ? "State why the student is not paying the full amount today..." : "e.g., Parent requested discount for siblings..."}
                                className={`min-h-[80px] bg-transparent border-none focus-visible:ring-0 p-3 text-sm font-medium italic ${isPartial && !paidNotes ? 'placeholder:text-red-400' : ''}`}
                                value={paidNotes}
                                onChange={(e) => setPaidNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </ScrollArea>

                <div className="px-6 py-4 sm:py-8 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold px-6 w-full sm:w-auto order-2 sm:order-1">Discard</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="rounded-xl px-12 h-14 gap-3 font-black shadow-2xl shadow-primary/30 text-lg group active:scale-95 transition-all w-full sm:w-auto order-1 sm:order-2"
                    >
                        {isPending ? 'Syncing...' : (
                            <>
                                <CheckCircle2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                Save Collection
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
