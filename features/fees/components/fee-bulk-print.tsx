'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Landmark, Hash, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE } from '@/constants/school-identity';

interface ChallanData {
    id: string;
    amount_due: number;
    arrears: number;
    fines: number;
    discount: number;
    paid_amount: number;
    month_year: string;
    students: {
        roll_number: string;
        full_name: string;
        classes: {
            name: string;
            section: string;
        };
    };
}

interface BulkPrintProps {
    open: boolean;
    data: ChallanData[];
    onClose: () => void;
    filters: {
        monthYear: string;
        status: string;
        classId: string;
        section: string;
    };
}

export function FeeBulkPrint({ open, data, onClose, filters }: BulkPrintProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (open && data.length > 0 && mounted) {
            const timer = setTimeout(() => {
                window.print();
                onClose();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [open, data, onClose, mounted]);

    if (!mounted || !open || !data || data.length === 0) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white text-zinc-900 overflow-auto print:static print:inset-auto print:z-0 print:bg-white print:text-black">
            <div className="max-w-[210mm] mx-auto p-8 bg-white print:p-8 print:w-full">
                {/* Master Header */}
                <div className="flex justify-between items-center border-b-4 border-zinc-900 pb-6 mb-8">
                    <div className="flex items-center gap-3">
                        <Landmark className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">{SCHOOL_NAME}</h1>
                            <div className="flex items-center gap-4">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Bulk Fee Collection Broadsheet</p>
                                <span className="text-zinc-300">|</span>
                                <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-widest">{SCHOOL_ADDRESS}</p>
                                <span className="text-zinc-300">|</span>
                                <p className="text-[8px] font-black text-zinc-600 tracking-widest">{SCHOOL_PHONE}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black uppercase tracking-tight">{filters.monthYear}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Report Generated: {format(new Date(), 'PPP')}</p>
                    </div>
                </div>

                {/* Filters Summary */}
                <div className="grid grid-cols-4 gap-4 mb-8 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <div className="space-y-1 text-center border-r border-zinc-200">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status Filter</p>
                        <p className="text-xs font-black uppercase tracking-tight">{filters.status === 'All' ? 'Consolidated' : filters.status}</p>
                    </div>
                    <div className="space-y-1 text-center border-r border-zinc-200">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Students</p>
                        <p className="text-xs font-black uppercase tracking-tight">{data.length} Records</p>
                    </div>
                    <div className="space-y-1 text-center border-r border-zinc-200">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Class</p>
                        <p className="text-xs font-black uppercase tracking-tight">{filters.classId === 'All' ? 'Multi-Class' : data[0]?.students?.classes?.name || 'Selected'}</p>
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Section</p>
                        <p className="text-xs font-black uppercase tracking-tight">{filters.section === 'All' ? 'All Sections' : `Section ${filters.section}`}</p>
                    </div>
                </div>

                {/* Table View */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="bg-zinc-900 text-white">
                                <th className="py-3 px-1.5 text-left font-black uppercase tracking-widest">Roll No.</th>
                                <th className="py-3 px-1.5 text-left font-black uppercase tracking-widest">Student Name</th>
                                <th className="py-3 px-1.5 text-left font-black uppercase tracking-widest">Class & Section</th>
                                <th className="py-3 px-1.5 text-right font-black uppercase tracking-widest">Monthly Fee</th>
                                <th className="py-3 px-1.5 text-right font-black uppercase tracking-widest">Arrears/Fine</th>
                                <th className="py-3 px-1.5 text-right font-black uppercase tracking-widest">Grand Total</th>
                                <th className="py-3 px-1.5 text-right font-black uppercase tracking-widest">Paid Amount</th>
                                <th className="py-3 px-1.5 text-right font-black uppercase tracking-widest bg-zinc-800">Net Balance / Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 italic">
                            {data.map((challan, i) => {
                                const fines = Number(challan.fines || 0);
                                const discount = Number(challan.discount || 0);
                                const addons = Number(challan.arrears || 0) + fines - discount;
                                const total = Number(challan.amount_due) + addons;
                                const remaining = total - Number(challan.paid_amount || 0);
                                const isPaid = remaining <= 0;

                                return (
                                    <tr key={challan.id} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                                        <td className="py-3 px-1.5 font-black">{challan.students?.roll_number}</td>
                                        <td className="py-3 px-1.5 font-bold not-italic">{challan.students?.full_name}</td>
                                        <td className="py-3 px-1.5 font-medium uppercase tracking-tighter">
                                            {challan.students?.classes?.name} - {challan.students?.classes?.section}
                                        </td>
                                        <td className="py-3 px-1.5 text-right font-medium">Rs. {Number(challan.amount_due).toLocaleString()}</td>
                                        <td className="py-3 px-1.5 text-right font-medium text-orange-600">
                                            {addons >= 0 ? '+' : ''}Rs. {addons.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-1.5 text-right font-black">Rs. {total.toLocaleString()}</td>
                                        <td className="py-3 px-1.5 text-right font-black text-emerald-600 italic">Rs. {Number(challan.paid_amount || 0).toLocaleString()}</td>
                                        <td className="py-3 px-1.5 text-right font-black text-zinc-900 border-l-2 border-zinc-900 bg-zinc-50/50">
                                            <div className="flex flex-col items-end">
                                                {remaining > 0 ? (
                                                    <span className="text-xs">Rs. {remaining.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-emerald-600 italic uppercase [text-shadow:_0_1px_rgba(0,0,0,0.1)]">CLEARED</span>
                                                )}
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className={cn(
                                                        "text-[7px] font-black uppercase tracking-tighter",
                                                        isPaid ? "text-emerald-600" : "text-orange-500"
                                                    )}>
                                                        {isPaid ? "Paid" : "Pending"}
                                                    </span>
                                                    {isPaid ? (
                                                        <CheckCircle2 className="w-2 h-2 text-emerald-500" />
                                                    ) : (
                                                        <AlertCircle className="w-2 h-2 text-orange-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary Totals */}
                <div className="mt-8 grid grid-cols-2 gap-20">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b pb-2">Broadsheet Notes</h4>
                        <div className="space-y-2">
                            <p className="text-[9px] font-bold italic leading-relaxed text-zinc-500 uppercase">
                                * Add-ons include historical arrears and current month late fines.
                            </p>
                            <p className="text-[9px] font-bold italic leading-relaxed text-zinc-500 uppercase">
                                * This report is strictly for internal bookkeeping and audit purposes.
                            </p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-xl">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none">Aggregated Collections</p>
                            <p className="text-2xl font-black tracking-tighter italic uppercase">Total Report Balance</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-white/60 mb-1 leading-none uppercase tracking-widest">Grand Remaining</p>
                            <p className="text-3xl font-black tracking-tighter">
                                Rs. {data.reduce((acc, c) => {
                                    const t = Number(c.amount_due) + Number(c.arrears || 0) + Number(c.fines || 0) - Number(c.discount || 0);
                                    const r = t - Number(c.paid_amount || 0);
                                    return acc + (r > 0 ? r : 0); // Only sum up positive debt
                                }, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Official Footer */}
                <div className="mt-auto pt-12 text-center opacity-30">
                    <div className="flex justify-center mb-4">
                        <Landmark className="w-6 h-6" />
                    </div>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] leading-relaxed">
                        Authorized Academic Resource Management System<br />
                        Designated Internal Document &bull; Verified Digital Signature Required
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
