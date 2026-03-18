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
import { Banknote, Landmark, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCollectFee } from '../../finance/api/use-fees-dashboard';

export interface DashboardChallan {
    id: string;
    student_id?: string;
    amount_due: number;
    paid_amount: number;
    status: string;
    month_year: string;
    students?: {
        full_name: string;
        roll_number: string;
        classes?: { name: string; section: string; };
    }
}

export function FeeCollectModal({ challan, open, onOpenChange }: { challan: DashboardChallan | null, open: boolean, onOpenChange: (o: boolean) => void }) {
    const remaining = challan ? Number(challan.amount_due) - Number(challan.paid_amount || 0) : 0;
    
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
    const [amountToPay, setAmountToPay] = useState<string>(remaining.toString());
    const { mutateAsync: collectFee, isPending } = useCollectFee();

    if (!challan) return null;

    const handleConfirm = async () => {
        const amount = Number(amountToPay);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount greater than 0');
            return;
        }
        if (amount > remaining) {
            toast.error('Payment cannot exceed the remaining balance');
            return;
        }

        try {
            await collectFee({
                id: challan.id,
                currentPaid: Number(challan.paid_amount || 0),
                amount,
                method: paymentMethod,
                totalDue: Number(challan.amount_due),
                studentId: challan.student_id as string,
                monthYear: challan.month_year
            });
            toast.success('Fee collected successfully');
            onOpenChange(false);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to collect fee');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Collect Fee</DialogTitle>
                            <DialogDescription>Record a payment for {challan.month_year}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Student Info */}
                    <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Student Name</p>
                                <p className="font-bold text-lg">{challan.students?.full_name}</p>
                            </div>
                            <Badge variant="outline" className="font-mono">{challan.students?.roll_number}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {challan.students?.classes?.name} - {challan.students?.classes?.section}
                        </p>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-muted-foreground">Total Expected</span>
                            <span className="font-medium">Rs. {Number(challan.amount_due).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-green-600 font-medium">Already Paid</span>
                            <span className="font-medium text-green-600">Rs. {Number(challan.paid_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t flex justify-between items-center">
                            <span className="font-bold">Remaining Due</span>
                            <span className="text-lg font-black text-orange-600">Rs. {remaining.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Paying Amount</Label>
                            <Input 
                                type="number" 
                                value={amountToPay} 
                                onChange={(e) => setAmountToPay(e.target.value)}
                                className="h-12 text-lg font-bold rounded-xl"
                                max={remaining}
                            />
                        </div>

                         <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Method</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                    className={`h-12 flex gap-2 rounded-xl ${paymentMethod === 'CASH' ? 'ring-2 ring-primary/20 bg-primary shadow-lg' : 'hover:bg-muted'}`}
                                    onClick={() => setPaymentMethod('CASH')}
                                >
                                    <Banknote className="h-4 w-4" />
                                    Cash
                                </Button>
                                <Button
                                    type="button"
                                    variant={paymentMethod === 'BANK' ? 'default' : 'outline'}
                                    className={`h-12 flex gap-2 rounded-xl ${paymentMethod === 'BANK' ? 'ring-2 ring-primary/20 bg-primary shadow-lg' : 'hover:bg-muted'}`}
                                    onClick={() => setPaymentMethod('BANK')}
                                >
                                    <Landmark className="h-4 w-4" />
                                    Bank Transfer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={isPending}
                        className="rounded-xl px-8 gap-2 font-bold shadow-lg shadow-primary/20"
                    >
                        {isPending ? 'Processing...' : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Save Payment
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
