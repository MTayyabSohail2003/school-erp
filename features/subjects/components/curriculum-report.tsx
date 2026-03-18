'use client';

import React from 'react';
import { type SubjectAssignmentWithClass } from '../api/subjects.api';

interface CurriculumReportProps {
    assignments: SubjectAssignmentWithClass[];
}

export function CurriculumReport({ assignments }: CurriculumReportProps) {
    // Group subjects by class
    const grouped = assignments.reduce((acc, curr) => {
        const classKey = `${curr.classes?.name || 'Unknown'} - ${curr.classes?.section || 'Unknown'}`;
        if (!acc[classKey]) acc[classKey] = [];
        acc[classKey].push(curr);
        return acc;
    }, {} as Record<string, SubjectAssignmentWithClass[]>);

    return (
        <div className="hidden print:block p-8 bg-white text-black min-h-screen">
            {/* Report Header */}
            <div className="flex justify-between items-center border-b-2 border-primary pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Academic Curriculum Report</h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">School Management System | Dynamic Assessment</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Generated On</p>
                    <p className="font-bold text-sm tracking-tight">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Table */}
            <div className="space-y-6">
                <table className="w-full border-collapse border-2 border-black/10">
                    <thead className="bg-[#f8f8f8]">
                        <tr>
                            <th className="border-2 border-black/10 p-3 text-left font-black uppercase text-[10px] tracking-widest w-1/4 text-slate-950">Class & Section</th>
                            <th className="border-2 border-black/10 p-3 text-left font-black uppercase text-[10px] tracking-widest text-slate-950">Active Subjects/Books</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(grouped).map(([className, subjects]) => (
                            <tr key={className} className="hover:bg-muted/5 transition-colors">
                                <td className="border-2 border-black/10 p-4 font-black text-sm uppercase align-top text-slate-950">
                                    {className}
                                </td>
                                <td className="border-2 border-black/10 p-4 align-top">
                                    <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                                        {subjects.map(s => (
                                            <div key={s.id} className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-black print:bg-black" />
                                                <span className="font-extrabold text-xs uppercase text-black print:text-black">
                                                    {s.name} <span className="text-[9px] text-gray-700 font-black ml-1 print:text-gray-900">({s.code || 'N/A'})</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-dashed border-black/20 flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 print:text-black">
                <p>Confidential Academic Document</p>
                <p>Property of AR-School ERP System</p>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background: white !important;
                        color: black !important;
                    }
                    .print-text-black {
                        color: black !important;
                    }
                    .print-font-bold {
                        font-weight: 800 !important;
                    }
                    table, th, td {
                        border-color: black !important;
                        color: black !important;
                    }
                    * {
                        color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
