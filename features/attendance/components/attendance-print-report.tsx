'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Landmark, Users, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface AttendanceReportProps {
    open: boolean;
    data: any[];
    onClose: () => void;
    filters: {
        className: string;
        section: string;
        date: string;
    };
}

export function AttendancePrintReport({ open, data, onClose, filters }: AttendanceReportProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (open && data.length > 0) {
            const timer = setTimeout(() => {
                window.print();
                onClose();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [open, data, onClose]);

    if (!mounted || !open || !data || data.length === 0) return null;

    const presentCount = data.filter(s => s.status === 'PRESENT').length;
    const absentCount = data.filter(s => s.status === 'ABSENT').length;
    const leaveCount = data.filter(s => s.status === 'LEAVE').length;
    const unmarkedCount = data.filter(s => s.status === 'UNMARKED' || !s.status).length;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white text-zinc-900 overflow-auto print:static print:inset-auto print:z-0 print:bg-white print:text-black">
            <div className="max-w-[210mm] mx-auto p-8 bg-white print:p-8 print:w-full">
                {/* Master Header */}
                <div className="flex justify-between items-center border-b-4 border-zinc-900 pb-6 mb-8">
                    <div className="flex items-center gap-3">
                        <Landmark className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">AR-School ERP</h1>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Daily Attendance Broadsheet</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black uppercase tracking-tight">Attendance Report</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Date: {format(parseISO(filters.date), 'PPPP')}</p>
                    </div>
                </div>

                {/* Filters Summary */}
                <div className="grid grid-cols-4 gap-4 mb-8 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <div className="space-y-1 text-center border-r border-zinc-200">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Class</p>
                        <p className="text-xs font-black uppercase tracking-tight">{filters.className}</p>
                    </div>
                    <div className="space-y-1 text-center border-r border-zinc-200">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Section</p>
                        <p className="text-xs font-black uppercase tracking-tight">{filters.section}</p>
                    </div>
                    <div className="space-y-1 text-center border-r border-zinc-200">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Total Students</p>
                        <p className="text-xs font-black uppercase tracking-tight">{data.length} Records</p>
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status</p>
                        <p className="text-xs font-black uppercase tracking-tight text-emerald-600">Verified</p>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="bg-zinc-900 text-white">
                                <th className="py-3 px-4 text-left font-black uppercase tracking-widest w-24">Roll No.</th>
                                <th className="py-3 px-4 text-left font-black uppercase tracking-widest">Student Name</th>
                                <th className="py-3 px-4 text-center font-black uppercase tracking-widest">Status</th>
                                <th className="py-3 px-4 text-left font-black uppercase tracking-widest">Remarks / Signature</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 italic">
                            {data.map((student, i) => (
                                <tr key={student.id} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                                    <td className="py-3 px-4 font-black">{student.roll_number}</td>
                                    <td className="py-3 px-4 font-bold not-italic">{student.full_name}</td>
                                    <td className="py-3 px-4 text-center uppercase font-black">
                                        <span className={
                                            student.status === 'PRESENT' ? 'text-emerald-600' :
                                            student.status === 'ABSENT' ? 'text-red-500' :
                                            student.status === 'LEAVE' ? 'text-amber-500' : 'text-zinc-300'
                                        }>
                                            {student.status || 'UNMARKED'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 border-l border-zinc-100">
                                        <div className="h-4 border-b border-zinc-200 border-dashed w-32" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Totals */}
                <div className="mt-8 grid grid-cols-2 gap-20">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b pb-2">Attendance Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                <span className="text-[9px] font-black uppercase text-emerald-600">Presents</span>
                                <span className="text-xs font-black text-emerald-700">{presentCount}</span>
                            </div>
                            <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-100">
                                <span className="text-[9px] font-black uppercase text-red-600">Absents</span>
                                <span className="text-xs font-black text-red-700">{absentCount}</span>
                            </div>
                            <div className="flex justify-between items-center bg-amber-50 p-2 rounded-lg border border-amber-100">
                                <span className="text-[9px] font-black uppercase text-amber-600">Leaves</span>
                                <span className="text-xs font-black text-amber-700">{leaveCount}</span>
                            </div>
                            <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                <span className="text-[9px] font-black uppercase text-zinc-400">Unmarked</span>
                                <span className="text-xs font-black text-zinc-500">{unmarkedCount}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-zinc-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-xl">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none">Class Performance</p>
                            <p className="text-2xl font-black tracking-tighter italic uppercase">Attendance Yield</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-white/60 mb-1 leading-none uppercase tracking-widest">Presence %</p>
                            <p className="text-3xl font-black tracking-tighter">
                                {data.length > 0 ? Math.round((presentCount / data.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Official Footer */}
                <div className="mt-auto pt-16 text-center opacity-30">
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
