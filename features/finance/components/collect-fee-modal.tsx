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
import { type FeeChallan } from '../schemas/fee-challan.schema';
import { Banknote, Landmark, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CollectFeeModalProps {
    challan: FeeChallan | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CollectFeeModal({ challan, open, onOpenChange }: CollectFeeModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
    const updateMutation = useUpdateChallanStatus();

    if (!challan) return null;

    const handleConfirm = async () => {
        try {
            await updateMutation.mutateAsync({
                id: challan.id!,
                status: 'PAID',
                paymentMethod,
            });
            toast.success('Fee collected successfully');
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to collect fee';
            toast.error(message);
        }
    };

    const totalAmount = challan.amount_due;
    const monthlyFee = totalAmount - (challan.arrears || 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Collect Student Fee</DialogTitle>
                            <DialogDescription>Record a new payment for the student</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Student Info Summary */}
                    <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Student Name</p>
                                <p className="font-bold text-lg">{challan.students?.full_name}</p>
                            </div>
                            <Badge variant="outline" className="font-mono">{challan.students?.roll_number}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {challan.students?.classes.name} - {challan.students?.classes.section}
                        </p>
                    </div>

                    {/* Amount Breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            Payment Details
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-muted-foreground">Monthly Tuition Fee</span>
                                <span className="font-medium">Rs. {monthlyFee.toLocaleString()}</span>
                            </div>
                            {challan.arrears > 0 && (
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">Arrears (Previous Dues)</span>
                                    <span className="font-medium text-orange-600 dark:text-orange-400">+ Rs. {challan.arrears.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t flex justify-between items-center">
                                <span className="font-bold text-lg">Total Payable</span>
                                <span className="text-2xl font-black text-primary">Rs. {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Method</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                className={`h-16 flex-col gap-1.5 rounded-2xl ${paymentMethod === 'CASH' ? 'ring-2 ring-primary/20 bg-primary shadow-lg' : 'hover:bg-muted'}`}
                                onClick={() => setPaymentMethod('CASH')}
                            >
                                <Banknote className="h-5 w-5" />
                                <span className="text-xs font-bold">Cash</span>
                            </Button>
                            <Button
                                type="button"
                                variant={paymentMethod === 'BANK' ? 'default' : 'outline'}
                                className={`h-16 flex-col gap-1.5 rounded-2xl ${paymentMethod === 'BANK' ? 'ring-2 ring-primary/20 bg-primary shadow-lg' : 'hover:bg-muted'}`}
                                onClick={() => setPaymentMethod('BANK')}
                            >
                                <Landmark className="h-5 w-5" />
                                <span className="text-xs font-bold">Bank Transfer</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={updateMutation.isPending}
                        className="rounded-xl px-8 gap-2 font-bold shadow-lg shadow-primary/20"
                    >
                        {updateMutation.isPending ? 'Processing...' : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Confirm Payment
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
