'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, Calendar, User, Hash, Landmark, Banknote } from 'lucide-react';
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE } from '@/constants/school-identity';

interface Challan {
    id: string;
    amount_due: number;
    arrears: number;
    fines: number;
    discount: number;
    paid_amount: number;
    month_year: string;
    payment_method?: string;
    students: {
        full_name: string;
        roll_number: string;
        classes: {
            name: string;
            section: string;
        };
    };
}

interface ReceiptProps {
    open: boolean;
    challan: Challan;
    onClose: () => void;
}

export function FeePrintReceipt({ open, challan, onClose }: ReceiptProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (open && mounted) {
            const timer = setTimeout(() => {
                window.print();
                onClose();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [open, onClose, mounted]);

    if (!mounted || !open || !challan) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white text-zinc-900 overflow-auto print:static print:inset-auto print:z-0 print:bg-white print:text-black">
            <div className="max-w-[210mm] mx-auto bg-white print:w-full">
                {/* ── SCHOOL COPY ── */}
                <div className="relative print:break-after-page">
                    <div className="absolute top-4 right-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 print:text-zinc-400 rotate-0">
                        School Copy (Headmaster)
                    </div>
                    <ReceiptContent challan={challan} />
                </div>

                {/* ── STUDENT COPY ── */}
                <div className="relative">
                    <div className="absolute top-4 right-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 print:text-zinc-400">
                        Student Copy
                    </div>
                    <ReceiptContent challan={challan} />
                </div>
            </div>
        </div>,
        document.body
    );
}

function ReceiptContent({ challan }: { challan: Challan }) {
    const totalExpected = Number(challan.amount_due || 0) + Number(challan.arrears || 0) + Number(challan.fines || 0) - Number(challan.discount || 0);
    const remaining = totalExpected - Number(challan.paid_amount || 0);
    const isPaid = remaining <= 0;

    return (
        <div className="p-8 print:p-8">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
                            <Landmark className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">{SCHOOL_NAME}</h1>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">
                        Official Fee Receipt / Payment Voucher
                    </p>
                    <div className="pt-1 space-y-0.5">
                        <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider">{SCHOOL_ADDRESS}</p>
                        <p className="text-[8px] font-black text-zinc-600 tracking-widest">{SCHOOL_PHONE}</p>
                    </div>
                </div>
                <div className="text-right space-y-1">
                    <div className="bg-zinc-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block">
                        ID: #{challan.id.slice(0, 8)}
                    </div>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase pt-1">Date: {format(new Date(), 'PPP')}</p>
                </div>
            </div>

            {/* Top Matrix */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-2">
                        <User className="w-2.5 h-2.5" /> Student
                    </p>
                    <h2 className="text-sm font-black leading-tight truncate">{challan.students?.full_name}</h2>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase italic">
                        {challan.students?.classes?.name} &bull; {challan.students?.classes?.section}
                    </p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-2">
                        <Hash className="w-2.5 h-2.5" /> Roll No
                    </p>
                    <h2 className="text-sm font-black tracking-tight">{challan.students?.roll_number}</h2>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Verified</p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-2">
                        <Calendar className="w-2.5 h-2.5" /> Period
                    </p>
                    <h2 className="text-sm font-black uppercase tracking-tight">{challan.month_year}</h2>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Session</p>
                </div>
            </div>

            {/* Fee Breakdown Table */}
            <div className="mb-6">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-100 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                            <th className="text-left py-1.5 px-3 rounded-l-lg">Description</th>
                            <th className="text-right py-1.5 px-3">Category</th>
                            <th className="text-right py-1.5 px-3 rounded-r-lg">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 italic">
                        <tr>
                            <td className="py-2 px-3 text-[11px] font-bold flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-zinc-900" />
                                Monthly Tuition Fee
                            </td>
                            <td className="text-right py-2 px-3 text-zinc-400 text-[8px] font-black uppercase tracking-widest">Base Fee</td>
                            <td className="text-right py-2 px-3 text-[11px] font-black italic">Rs. {Number(challan.amount_due).toLocaleString()}</td>
                        </tr>
                        {Number(challan.arrears || 0) !== 0 && (
                            <tr>
                                <td className="py-2 px-3 text-[11px] font-bold text-orange-600 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-orange-500" />
                                    Arrears / Pending
                                </td>
                                <td className="text-right py-2 px-3 text-zinc-400 text-[8px] font-black uppercase tracking-widest">Overdue</td>
                                <td className="text-right py-2 px-3 text-[11px] font-black text-orange-600">
                                    {Number(challan.arrears) > 0 ? '+' : '-'} Rs. {Math.abs(Number(challan.arrears)).toLocaleString()}
                                </td>
                            </tr>
                        )}
                        {Number(challan.fines || 0) > 0 && (
                            <tr>
                                <td className="py-2 px-3 text-[11px] font-bold text-blue-600 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                                    Late Charges / Fines
                                </td>
                                <td className="text-right py-2 px-3 text-zinc-400 text-[8px] font-black uppercase tracking-widest">Penalty</td>
                                <td className="text-right py-2 px-3 text-[11px] font-black text-blue-600">+ Rs. {Number(challan.fines).toLocaleString()}</td>
                            </tr>
                        )}
                        {Number(challan.discount || 0) > 0 && (
                            <tr>
                                <td className="py-2 px-3 text-[11px] font-bold text-emerald-600 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    Waiver / Scholarship
                                </td>
                                <td className="text-right py-2 px-3 text-zinc-400 text-[8px] font-black uppercase tracking-widest">Waiver</td>
                                <td className="text-right py-2 px-3 text-[11px] font-black text-emerald-600">- Rs. {Number(challan.discount).toLocaleString()}</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-zinc-900 text-white">
                            <td colSpan={2} className="py-2 px-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-l-lg">Total Amount</td>
                            <td className="py-2 px-4 text-base font-black text-right rounded-r-lg tracking-tighter">Rs. {totalExpected.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Status Section */}
            <div className="grid grid-cols-2 gap-8 border-t border-zinc-100 pt-4 mt-2">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                            <span className="text-[7px] font-black uppercase tracking-widest text-zinc-400 block">Paid</span>
                            <span className="text-xs font-black text-zinc-900 tracking-tight">
                                Rs. {Number(challan.paid_amount || 0).toLocaleString()}
                            </span>
                        </div>
                        {!isPaid ? (
                            <div className="bg-orange-50 p-2 rounded-xl border border-orange-100">
                                <span className="text-[7px] font-black uppercase tracking-widest text-orange-600/60 block">Remaining</span>
                                <span className="text-xs font-black text-orange-600 tracking-tight">
                                    Rs. {remaining.toLocaleString()}
                                </span>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 text-center">
                                <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600/60 block">Status</span>
                                <span className="text-[10px] font-black text-emerald-600">CLEARED</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col justify-end">
                    <div className="w-full h-px bg-zinc-200 mb-1" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-center text-zinc-300">Auth Signature & Stamp</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-zinc-100 flex justify-between items-center grayscale opacity-40">
                <p className="text-[7px] font-bold text-zinc-400 uppercase">System Generated Proof of Payment</p>
                {challan.payment_method && (
                    <div className="flex items-center gap-1 text-zinc-400">
                        {challan.payment_method === 'CASH' ? <Banknote className="w-2.5 h-2.5" /> : <Landmark className="w-2.5 h-2.5" />}
                        <span className="text-[7px] font-black uppercase tracking-widest">Via {challan.payment_method}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
