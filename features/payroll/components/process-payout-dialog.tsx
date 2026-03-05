'use client';

import { useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useRecordPayout } from '../api/use-payroll-ledger';

interface ProcessPayoutDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    teacher: {
        user_id: string;
        full_name: string;
        monthly_salary: number;
    } | null;
}

// Get current month in YYYY-MM format
function getCurrentMonthYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export function ProcessPayoutDialog({ isOpen, setIsOpen, teacher }: ProcessPayoutDialogProps) {
    const [monthYear, setMonthYear] = useState(getCurrentMonthYear());
    const [deductions, setDeductions] = useState<string>('0');
    const recordPayout = useRecordPayout();

    const baseSalary = teacher?.monthly_salary ?? 0;
    const deductionAmount = Number(deductions) || 0;
    const netPaid = baseSalary - deductionAmount;

    const handlePayout = () => {
        if (!teacher) return;
        if (deductionAmount < 0) {
            toast.error('Deductions cannot be negative.');
            return;
        }
        if (deductionAmount > baseSalary) {
            toast.error('Deductions cannot exceed base salary.');
            return;
        }

        recordPayout.mutate({
            teacherId: teacher.user_id,
            monthYear,
            baseSalary,
            deductions: deductionAmount,
        }, {
            onSuccess: () => {
                toast.success(`Payout of Rs. ${netPaid.toLocaleString()} recorded for ${teacher.full_name}.`);
                setIsOpen(false);
                setDeductions('0');
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to record payout.');
            },
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setDeductions('0');
            setMonthYear(getCurrentMonthYear());
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        Process Monthly Payout
                    </DialogTitle>
                    <DialogDescription>
                        Record a salary payout for <strong>{teacher?.full_name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label>Month (YYYY-MM)</Label>
                        <Input
                            type="month"
                            value={monthYear}
                            onChange={(e) => setMonthYear(e.target.value)}
                        />
                    </div>

                    <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Base Salary</span>
                            <span className="font-semibold">Rs. {baseSalary.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Deductions (Rs.)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={baseSalary}
                                value={deductions}
                                onChange={(e) => setDeductions(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t font-bold">
                            <span>Net Payable</span>
                            <span className="text-green-600">Rs. {netPaid.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={recordPayout.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handlePayout} disabled={recordPayout.isPending || netPaid < 0}>
                        {recordPayout.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                        ) : 'Process Payout'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
