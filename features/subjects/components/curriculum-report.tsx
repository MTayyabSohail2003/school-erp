'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { type Subject, type SubjectAssignmentWithClass } from '../api/subjects.api';
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE } from '@/constants/school-identity';

interface CurriculumReportProps {
    open: boolean;
    onClose: () => void;
    assignments: SubjectAssignmentWithClass[];
    masterPool?: Subject[];
    filterClassId?: string | null;
}

export function CurriculumReport({ open, onClose, assignments = [], masterPool = [], filterClassId }: CurriculumReportProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (open) {
            const timer = setTimeout(() => {
                window.print();
                onClose();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    if (!mounted || !open) return null;

    // Grouping logic
    const groupedData: Record<string, { className: string, section: string, subjects: { name: string, code: string | null }[] }> = {};
    const dataToProcess = filterClassId 
        ? assignments.filter(a => a.class_id === filterClassId)
        : assignments;

    if (dataToProcess.length > 0) {
        dataToProcess.forEach(curr => {
            const classKey = curr.class_id || (curr.classes?.name + curr.classes?.section) || 'pool';
            if (!groupedData[classKey]) {
                groupedData[classKey] = {
                    className: curr.classes?.name || 'Academic',
                    section: curr.classes?.section || 'Pool',
                    subjects: []
                };
            }
            groupedData[classKey].subjects.push({ name: curr.name, code: curr.code });
        });
    } else if (masterPool.length > 0 && !filterClassId) {
        groupedData['master'] = {
            className: 'Master Collection',
            section: 'Inventory',
            subjects: masterPool.map(m => ({ name: m.name, code: m.code }))
        };
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white text-black overflow-auto print:static print:inset-auto print:z-0">
            <div className="max-w-[210mm] mx-auto p-12 bg-white print:p-8 print:w-full">
                {/* STYLED FOR PURE BLACK & WHITE PRINTING */}
                <div style={{ display: 'flex', justifyContent: 'space-between', border: '3px solid black', marginBottom: '25px' }}>
                    <div style={{ width: '60%', padding: '25px', borderRight: '3px solid black', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '55px', height: '55px', border: '3px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '35px', color: 'black' }} fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'black', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>{SCHOOL_NAME}</h1>
                            <p style={{ margin: '3px 0 0 0', fontSize: '11px', fontWeight: '800', color: '#000', textTransform: 'uppercase' }}>Official Academic Planning Department</p>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#333' }}>{SCHOOL_ADDRESS} | Tel: {SCHOOL_PHONE}</p>
                        </div>
                    </div>
                    <div style={{ width: '40%', padding: '25px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Curriculum List</h2>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: '800' }}>Academic Session: 2024-2025</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: '800' }}>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Professional B&W Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'black' }}>
                            <th style={{ border: '2px solid black', padding: '12px', color: 'white', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', width: '20%' }}>Class Group</th>
                            <th style={{ border: '2px solid black', padding: '12px', color: 'white', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', width: '15%' }}>Section</th>
                            <th style={{ border: '2px solid black', padding: '12px', color: 'white', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'left', paddingLeft: '30px' }}>Assigned Subjects / Books</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(groupedData).map((row, idx) => (
                            <tr key={idx}>
                                <td style={{ border: '2px solid black', padding: '15px', fontSize: '13px', fontWeight: '900', textAlign: 'left', textTransform: 'uppercase' }}>{row.className}</td>
                                <td style={{ border: '2px solid black', padding: '15px', fontSize: '13px', fontWeight: '900', textAlign: 'center' }}>{row.section}</td>
                                <td style={{ border: '2px solid black', padding: '15px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {row.subjects.map((sub, sIdx) => (
                                            <div key={sIdx} style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px' }}>•</span>
                                                <span>{sub.name} <span style={{ fontSize: '9px', fontWeight: '600', opacity: 0.6 }}>[{sub.code || '---'}]</span></span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Secure Institutional Footer */}
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '20px 0', borderTop: '2px solid #000' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Prepared & Verified By:</p>
                        <div style={{ width: '150px', height: '1px', backgroundColor: 'black', marginTop: '30px' }}></div>
                        <p style={{ margin: '5px 0 0 0', fontSize: '10px', fontWeight: '800' }}>Head of Academics</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' }}>{SCHOOL_NAME} ERP</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '8px', fontWeight: '700' }}>MANAGEMENT SYSTEM v4.2</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800' }}>Confidential Document</p>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800' }}>Page 1 of 1</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body > *:not(.fixed) { display: none !important; }
                    .fixed.inset-0 { 
                        position: static !important; 
                        display: block !important; 
                        background: white !important;
                        padding: 0 !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>,
        document.body
    );
}
