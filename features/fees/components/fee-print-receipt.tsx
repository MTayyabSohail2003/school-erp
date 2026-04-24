'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, Calendar, User, Hash, Landmark, Banknote } from 'lucide-react';

interface ReceiptProps {
    open: boolean;
    challan: any;
    onClose: () => void;
}

export function FeePrintReceipt({ open, challan, onClose }: ReceiptProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (open) {
            // Small delay to ensure styles are loaded before print dialog
            const timer = setTimeout(() => {
                window.print();
                onClose();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    if (!mounted || !open || !challan) return null;

    const totalExpected = Number(challan.amount_due || 0) + Number(challan.arrears || 0) + Number(challan.fines || 0) - Number(challan.discount || 0);
    const remaining = totalExpected - Number(challan.paid_amount || 0);
    const isPaid = remaining <= 0;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white text-zinc-900 overflow-auto print:static print:inset-auto print:z-0 print:bg-white print:text-black">
            <div className="max-w-[210mm] mx-auto p-8 bg-white print:p-8 print:w-full">
                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                                <Landmark className="text-white w-7 h-7" />
                            </div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">AR-School ERP</h1>
                        </div>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Official Fee Receipt / Payment Voucher</p>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="bg-zinc-900 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest">
                            Receipt ID: #{challan.id.slice(0, 8)}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase pt-1">Issued: {format(new Date(), 'PPP p')}</p>
                    </div>
                </div>

                {/* Top Matrix */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-2">
                            <User className="w-3 h-3" /> Student Profile
                        </p>
                        <h2 className="text-base font-black leading-tight mb-0.5">{challan.students?.full_name}</h2>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase italic">
                            {challan.students?.classes?.name} &bull; Section {challan.students?.classes?.section}
                        </p>
                    </div>
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-2">
                            <Hash className="w-3 h-3" /> Roll Number
                        </p>
                        <h2 className="text-xl font-black">{challan.students?.roll_number}</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verified Record</p>
                    </div>
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Billing Period
                        </p>
                        <h2 className="text-base font-black uppercase tracking-tight">{challan.month_year}</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Standard Session</p>
                    </div>
                </div>

                {/* Fee Breakdown Table */}
                <div className="mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5 border-b border-zinc-100 pb-1">Financial Breakdown</h3>
                    <table className="w-full">
                        <thead>
                            <tr className="bg-zinc-100 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                <th className="text-left py-2 px-4 rounded-l-lg">Description</th>
                                <th className="text-right py-2 px-4">Historical Rate</th>
                                <th className="text-right py-2 px-4 rounded-r-lg">Current Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 italic">
                            <tr>
                                <td className="py-3 px-4 text-xs font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                                    Monthly Tuition / Base Fee
                                </td>
                                <td className="text-right py-3 px-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest">Base Rate</td>
                                <td className="text-right py-3 px-4 text-xs font-black italic">Rs. {Number(challan.amount_due).toLocaleString()}</td>
                            </tr>
                            {Number(challan.arrears || 0) !== 0 && (
                                <tr>
                                    <td className="py-3 px-4 text-xs font-bold text-orange-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        Previous Balance / Arrears
                                    </td>
                                    <td className="text-right py-3 px-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest">Overdue</td>
                                    <td className="text-right py-3 px-4 text-xs font-black text-orange-600">
                                        {Number(challan.arrears) > 0 ? '+' : '-'} Rs. {Math.abs(Number(challan.arrears)).toLocaleString()}
                                    </td>
                                </tr>
                            )}
                            {Number(challan.fines || 0) > 0 && (
                                <tr>
                                    <td className="py-3 px-4 text-xs font-bold text-blue-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Late Charges / Attendance Fines
                                    </td>
                                    <td className="text-right py-3 px-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest">Penalty</td>
                                    <td className="text-right py-3 px-4 text-xs font-black text-blue-600">+ Rs. {Number(challan.fines).toLocaleString()}</td>
                                </tr>
                            )}
                            {Number(challan.discount || 0) > 0 && (
                                <tr>
                                    <td className="py-3 px-4 text-xs font-bold text-emerald-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Waiver / Scholarship Applied
                                    </td>
                                    <td className="text-right py-3 px-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest">Adjustment</td>
                                    <td className="text-right py-3 px-4 text-xs font-black text-emerald-600">- Rs. {Number(challan.discount).toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-zinc-900 text-white shadow-xl">
                                <td colSpan={2} className="py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-l-xl">Total Payable Amount</td>
                                <td className="py-3 px-6 text-xl font-black text-right rounded-r-xl tracking-tighter">Rs. {totalExpected.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Status Section */}
                <div className="grid grid-cols-2 gap-12 border-t border-zinc-100 pt-8 mt-4">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Transaction Summary</p>
                            {isPaid ? (
                                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-500">
                                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                                    <div>
                                        <span className="text-xl font-black tracking-tighter uppercase italic block leading-none">FULLY PAID</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60">Institution Dues Cleared</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-orange-500 bg-orange-50/50 p-4 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in zoom-in duration-500">
                                    <AlertCircle className="w-6 h-6 animate-pulse text-orange-400" />
                                    <div>
                                        <span className="text-xl font-black tracking-tighter uppercase italic block leading-none">NOTICE: LESS PAID</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-500/60">Outstanding Balance Remains</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 shadow-sm">
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400 block mb-1">Paid to date</span>
                                <span className="text-lg font-black text-zinc-900 tracking-tighter flex items-baseline gap-1">
                                    <span className="text-xs">Rs.</span> {Number(challan.paid_amount || 0).toLocaleString()}
                                </span>
                            </div>
                            {!isPaid ? (
                                <div className="bg-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-600/20 border border-orange-500 group animate-pulse">
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/70 block mb-1">Still Remaining</span>
                                    <span className="text-lg font-black text-white tracking-tighter flex items-baseline gap-1">
                                        <span className="text-xs">Rs.</span> {remaining.toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-600/20 border border-emerald-500">
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/70 block mb-1">Account Status</span>
                                    <span className="text-lg font-black text-white tracking-tighter flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> CLEARED
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col justify-end space-y-8">
                        {challan.payment_method && (
                            <div className="flex items-center gap-2 justify-end text-zinc-400">
                                {challan.payment_method === 'CASH' ? <Banknote className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                                <span className="text-[9px] font-black uppercase tracking-widest">Paid via {challan.payment_method}</span>
                            </div>
                        )}
                        
                        <div className="mt-auto">
                            <div className="w-full h-px bg-zinc-200 mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-center text-zinc-400">Authorized Signature & Stamp</p>
                        </div>
                    </div>
                </div>

                {/* Footer Disclaimers */}
                <div className="mt-8 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-6 grayscale opacity-50">
                    <div>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase leading-relaxed">
                            Terms: This is a system-generated document and serves as an official proof of payment. 
                            Please keep it safe for future reference. Fees once paid are non-refundable.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-bold text-zinc-400 uppercase leading-relaxed">
                            For any discrepancies, please visit the accounts department with this receipt 
                            within 7 working days of issuance.
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
