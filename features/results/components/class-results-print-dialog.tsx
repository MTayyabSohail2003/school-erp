import React from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft, School } from 'lucide-react';
import { calculateGradeAndPercentage } from '../schemas/results.schema';

interface ClassResultsPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: any[];
    results?: any[];
    isLoading: boolean;
    termName: string | null;
    classNameStr: string | null;
}

export function ClassResultsPrintDialog({
    open,
    onOpenChange,
    students,
    results,
    isLoading,
    termName,
    classNameStr,
}: ClassResultsPrintDialogProps) {
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);
    
    // Process aggregated data for each student
    const studentAggregates = React.useMemo(() => {
        if (!results || !students) return [];

        return students.map(student => {
            const studentResults = results.filter(r => r.student_id === student.id);
            const totalMax = studentResults.reduce((sum, r) => sum + r.total_marks, 0);
            const totalObtained = studentResults.reduce((sum, r) => sum + r.obtained_marks, 0);
            
            // Only calculate if student has results to avoid 0/0 and fake F
            if (studentResults.length === 0) {
                return { ...student, totalMax: 0, totalObtained: 0, percentage: 0, grade: 'N/A' };
            }

            const { percentage, grade } = calculateGradeAndPercentage(totalObtained, totalMax);
            
            return {
                ...student,
                totalMax,
                totalObtained,
                percentage,
                grade
            };
        });
    }, [students, results]);

    const handlePrint = () => {
        const printBtn = document.activeElement as HTMLElement;
        if (printBtn) printBtn.blur();
        setTimeout(() => window.print(), 100);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="!max-w-none !w-screen !h-screen !m-0 !rounded-none border-none bg-background p-0 overflow-hidden shadow-2xl flex flex-col no-print">
                    <DialogHeader className="p-8 pb-4 bg-muted/20 border-b border-border/40 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl">
                                    <School className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-foreground/90">
                                        Class Performance Broadsheet
                                    </DialogTitle>
                                    <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1">
                                        {classNameStr} | {termName}
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[10px] gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground transition-all"
                                    onClick={handlePrint}
                                    disabled={isLoading || students.length === 0}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                    Print Class List
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[10px] gap-2"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Exit View
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 pt-6 overflow-y-auto flex-1 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                        <div className="max-w-5xl mx-auto space-y-8">
                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">Computing Aggregates...</p>
                                </div>
                            ) : (
                                <div className="rounded-[2rem] border border-border/40 overflow-hidden bg-background shadow-2xl">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b-2 border-border">
                                            <tr>
                                                <th className="py-4 px-6 text-left font-black uppercase text-[11px] tracking-widest text-muted-foreground">Roll No</th>
                                                <th className="py-4 px-6 text-left font-black uppercase text-[11px] tracking-widest text-muted-foreground">Student Name</th>
                                                <th className="py-4 px-6 text-center font-black uppercase text-[11px] tracking-widest text-muted-foreground">Obtained</th>
                                                <th className="py-4 px-6 text-center font-black uppercase text-[11px] tracking-widest text-muted-foreground">Total</th>
                                                <th className="py-4 px-6 text-center font-black uppercase text-[11px] tracking-widest text-muted-foreground">% Score</th>
                                                <th className="py-4 px-6 text-right font-black uppercase text-[11px] tracking-widest text-muted-foreground">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {studentAggregates.map((student) => (
                                                <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-3 px-6 font-mono text-xs font-bold opacity-60">{student.roll_number}</td>
                                                    <td className="py-3 px-6 font-bold uppercase">{student.full_name}</td>
                                                    <td className="py-3 px-6 text-center font-black">{student.totalObtained}</td>
                                                    <td className="py-3 px-6 text-center font-medium opacity-60">{student.totalMax}</td>
                                                    <td className="py-3 px-6 text-center font-bold">
                                                        {student.totalMax > 0 ? `${student.percentage.toFixed(1)}%` : '-'}
                                                    </td>
                                                    <td className="py-3 px-6 text-right font-black italic">{student.grade}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* HIDDEN PRINTABLE BROADSHEET - Portaled directly to body to bypass Radix UI dialog constraints completely */}
            {mounted && open && document.body && createPortal(
                <div id="printable-class-results" className="font-serif hidden print:block bg-white w-full h-auto">
                    <style dangerouslySetInnerHTML={{ __html: `
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 10mm; 
                            }
                            
                            /* Completely wipe all other elements gracefully from flow */
                            body > *:not(#printable-class-results) {
                                display: none !important;
                            }
                            
                            html, body {
                                background: white !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                overflow: visible !important;
                                height: auto !important;
                                min-height: auto !important;
                            }
                            
                            /* Natural document flow, NO absolute or fixed bugs */
                            #printable-class-results {
                                display: block !important;
                                position: static !important;
                                transform: none !important;
                                width: 100% !important;
                                background-color: white !important;
                                color: black !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            
                            #printable-class-results * {
                                color: black !important;
                                border-color: black !important;
                                visibility: visible !important;
                            }
                            /* Preserve some specific grays if needed */
                            #printable-class-results .text-slate-500 {
                                color: #64748b !important;
                            }
                        }
                        
                        @media screen {
                            #printable-class-results {
                                display: none !important;
                            }
                        }
                    `}} />
                    
                    <div className="border-[4px] border-black p-6 bg-white min-h-[A4]">
                        <div className="border-b-4 border-black pb-4 mb-6 text-center">
                            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">AR SCHOOL ERP</h1>
                            <h2 className="text-xl font-bold uppercase tracking-widest italic opacity-80 leading-tight">Class Performance Broadsheet</h2>
                            <div className="mt-4 inline-block border-2 border-black px-6 py-2">
                                <p className="text-xs font-black uppercase tracking-[0.2em]">Class: {classNameStr} | Term: {termName}</p>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-black text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-black">
                                    <th className="border border-black py-2 px-3 text-left uppercase text-[10px] tracking-widest font-black whitespace-nowrap">Roll No</th>
                                    <th className="border border-black py-2 px-3 text-left uppercase text-[10px] tracking-widest font-black w-full">Student Name</th>
                                    <th className="border border-black py-2 px-3 text-center uppercase text-[10px] tracking-widest font-black whitespace-nowrap">Obtained</th>
                                    <th className="border border-black py-2 px-3 text-center uppercase text-[10px] tracking-widest font-black whitespace-nowrap">Total</th>
                                    <th className="border border-black py-2 px-3 text-center uppercase text-[10px] tracking-widest font-black whitespace-nowrap">% Score</th>
                                    <th className="border border-black py-2 px-3 text-center uppercase text-[10px] tracking-widest font-black whitespace-nowrap">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentAggregates.map((student) => (
                                    <tr key={student.id} className="border-b border-black">
                                        <td className="border border-black py-1.5 px-3 font-mono text-xs font-bold">{student.roll_number}</td>
                                        <td className="border border-black py-1.5 px-3 font-bold uppercase text-xs">{student.full_name}</td>
                                        <td className="border border-black py-1.5 px-3 text-center font-black text-xs">{student.totalObtained}</td>
                                        <td className="border border-black py-1.5 px-3 text-center font-bold text-xs opacity-80">{student.totalMax}</td>
                                        <td className="border border-black py-1.5 px-3 text-center font-bold text-xs">
                                            {student.totalMax > 0 ? `${student.percentage.toFixed(1)}%` : '-'}
                                        </td>
                                        <td className="border border-black py-1.5 px-3 text-center font-black italic text-xs">
                                            {student.grade === 'N/A' ? '-' : student.grade}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-12 mb-4">
                            <table className="w-full">
                                <tbody>
                                    <tr>
                                        <td className="w-1/3 text-center border-t border-black pt-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Prepared By</span>
                                        </td>
                                        <td className="w-1/3"></td>
                                        <td className="w-1/3 text-center border-t border-black pt-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Principal's Signature</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="text-center mt-6">
                            <p className="text-[8px] font-medium italic opacity-40 uppercase tracking-widest">
                                Generated by AR-ERP System | Date: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
