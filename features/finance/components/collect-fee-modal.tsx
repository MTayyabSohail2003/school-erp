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
import { Badge } from '@/components/ui/badge';
import { useUpdateChallanStatus } from '../api/use-challans';
import { type FeeChallan, type ChallanStatus } from '../schemas/fee-challan.schema';
import { Banknote, Landmark, CheckCircle2, AlertCircle, Coins, MessageSquare, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CollectFeeModalProps {
    challan: FeeChallan | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CollectFeeModal({ challan, open, onOpenChange }: CollectFeeModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'ONLINE'>('CASH');
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [fines, setFines] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [paidNotes, setPaidNotes] = useState<string>('');
    
    const updateMutation = useUpdateChallanStatus();

    // Reset local state when challan changes or modal opens
    const [prevChallanId, setPrevChallanId] = useState<string | null>(null);
    if (challan?.id !== prevChallanId) {
        setPrevChallanId(challan?.id || null);
        setPaidAmount(challan?.amount_due || 0);
        setFines(challan?.fines || 0);
        setDiscount(challan?.discount || 0);
        setPaidNotes(challan?.paid_notes || '');
    }

    if (!challan) return null;

    const totalPayable = (challan.amount_due || 0) + fines - discount;
    const remainingBalance = Math.max(0, totalPayable - paidAmount);
    const isPartial = paidAmount > 0 && paidAmount < totalPayable;
    const finalStatus: ChallanStatus = paidAmount >= totalPayable ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING');

    const handleConfirm = async () => {
        if (isPartial && !paidNotes.trim()) {
            toast.error('Please provide a reason for partial payment');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: challan.id!,
                status: finalStatus,
                paymentMethod,
                paidAmount,
                fines,
                discount,
                paidNotes,
            });
            toast.success(isPartial ? 'Partial payment recorded' : 'Full payment collected');
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to collect fee';
            toast.error(message);
        }
    };

    const monthlyFee = (challan.amount_due - (challan.arrears || 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-primary p-6 py-8 text-primary-foreground relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 h-32 w-32 bg-black/10 rounded-full blur-2xl" />
                    
                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                <Banknote className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-white leading-none mb-1">Fee Collection</DialogTitle>
                                <DialogDescription className="text-primary-foreground/70 font-medium">Record and track student payments</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="mt-8 flex justify-between items-end relative z-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Outstanding</p>
                            <p className="text-4xl font-black tracking-tighter">Rs. {totalPayable.toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                                {finalStatus === 'PAID' ? 'Full Payment' : finalStatus === 'PARTIAL' ? 'Partial Payment' : 'Pending'}
                             </div>
                        </div>
                    </div>
                </div>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-6 space-y-8">
                        {/* Student Badge Card */}
                        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border-2 border-primary/20">
                                    {challan.students?.full_name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-sm tracking-tight">{challan.students?.full_name}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{challan.students?.classes.name} — {challan.students?.classes.section}</span>
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
                                    <Plus className="h-3 w-3" /> Billing Summary
                                </h4>
                                <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-dashed">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Monthly Fee</span>
                                        <span>Rs. {monthlyFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-orange-500 underline decoration-dotted offset-2">Arrears (Past)</span>
                                        <span className="text-orange-600">+ Rs. {(challan.arrears || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-blue-500">New Fines</span>
                                        <span className="text-blue-600">+ Rs. {fines.toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-emerald-500">Waiver/Discount</span>
                                            <span className="text-emerald-600">- Rs. {discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <Separator className="bg-border/50" />
                                    <div className="flex justify-between text-sm font-black pt-1">
                                        <span>Total Due</span>
                                        <span className="text-primary tracking-tight">Rs. {totalPayable.toLocaleString()}</span>
                                    </div>
                                </div>

                                {remainingBalance > 0 && (
                                    <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex items-start gap-3">
                                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-amber-700 uppercase">Balance to Arrears</span>
                                            <span className="text-xs font-black text-amber-900 dark:text-amber-400">Rs. {remainingBalance.toLocaleString()} will carry to next month</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Inputs */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Actual Collection (Rs.)</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs">Rs.</div>
                                        <Input 
                                            type="number" 
                                            value={paidAmount} 
                                            onChange={(e) => setPaidAmount(Number(e.target.value))}
                                            className="h-11 pl-10 border-2 font-black rounded-xl focus-visible:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fines</Label>
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
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Method</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                            className={`flex-1 h-10 rounded-xl gap-2 font-bold ${paymentMethod === 'CASH' ? 'ring-2 ring-primary/20 shadow-md' : ''}`}
                                            onClick={() => setPaymentMethod('CASH')}
                                        >
                                            <Banknote className="h-4 w-4" /> Cash
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'BANK' ? 'default' : 'outline'}
                                            className={`flex-1 h-10 rounded-xl gap-2 font-bold ${paymentMethod === 'BANK' ? 'ring-2 ring-primary/20 shadow-md' : ''}`}
                                            onClick={() => setPaymentMethod('BANK')}
                                        >
                                            <Landmark className="h-4 w-4" /> Bank
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reason / Notes */}
                        <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-dashed">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" /> {isPartial ? 'Reason for Partial Payment (Mandatory)' : 'Internal Notes (Optional)'}
                             </Label>
                             <Textarea 
                                placeholder={isPartial ? "Provide a clear reason for the pending balance..." : "Special mentions regarding this collection..."}
                                className={`min-h-[80px] bg-transparent border-none focus-visible:ring-0 p-0 text-sm font-medium italic ${isPartial && !paidNotes ? 'placeholder:text-red-400' : ''}`}
                                value={paidNotes}
                                onChange={(e) => setPaidNotes(e.target.value)}
                             />
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-6 bg-muted/30 border-t flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Discard Changes</Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={updateMutation.isPending}
                        className="rounded-xl px-10 h-12 gap-2 font-black shadow-xl shadow-primary/20"
                    >
                        {updateMutation.isPending ? 'Syncing...' : (
                            <>
                                <CheckCircle2 className="h-5 w-5" />
                                Record Payment
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
