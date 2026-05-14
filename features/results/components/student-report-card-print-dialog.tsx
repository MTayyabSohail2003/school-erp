'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE } from '@/constants/school-identity';

interface ResultRecord {
    id: string;
    subjects: { name: string; code?: string };
    obtained_marks: number;
    total_marks: number;
    percentage: number;
    grade: string;
}

interface StudentReportCardPrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: any;
    results: ResultRecord[];
    termName: string;
    academicYear: string;
    className: string;
}

const GRADE_COLORS: Record<string, string> = {
    A: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    B: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    C: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    D: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
    F: 'bg-red-500/15 text-red-600 border-red-500/30',
};

export function StudentReportCardPrintDialog({
    open,
    onOpenChange,
    student,
    results,
    termName,
    academicYear,
    className,
}: StudentReportCardPrintDialogProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const summary = React.useMemo(() => {
        const totalObtained = results.reduce((s, r) => s + r.obtained_marks, 0);
        const totalMax = results.reduce((s, r) => s + r.total_marks, 0);
        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        const isPassed = percentage >= 40;

        // Simple grade calculation for summary
        let finalGrade = 'F';
        if (percentage >= 85) finalGrade = 'A';
        else if (percentage >= 70) finalGrade = 'B';
        else if (percentage >= 50) finalGrade = 'C';
        else if (percentage >= 40) finalGrade = 'D';

        return { totalObtained, totalMax, percentage, isPassed, finalGrade };
    }, [results]);

    const handlePrint = () => {
        const printBtn = document.activeElement as HTMLElement;
        if (printBtn) printBtn.blur();
        setTimeout(() => window.print(), 100);
    };

    if (!mounted) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="!max-w-none !w-screen !h-screen !m-0 !rounded-none border-none bg-background p-0 overflow-hidden shadow-2xl flex flex-col no-print">
                    <DialogHeader className="p-8 pb-4 bg-muted/20 border-b border-border/40 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl">
                                    <GraduationCap className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-foreground/90">
                                        Report Card Preview
                                    </DialogTitle>
                                    <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1">
                                        {student.full_name} • {className} • {termName}
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    className="rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg glow-green"
                                    onClick={handlePrint}
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Report Card
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

                    <div className="p-8 pt-6 overflow-y-auto flex-1 bg-muted/5">
                        <div className="max-w-4xl mx-auto bg-card border rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            
                            {/* Report Card Header */}
                            <div className="flex flex-col items-center justify-center text-center mb-12 pb-8 border-b-2 border-dashed border-border/60">
                                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2 italic gradient-text">{SCHOOL_NAME}</h1>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-6">
                                    {SCHOOL_ADDRESS} • {SCHOOL_PHONE}
                                </p>
                                
                                <div className="h-1 w-24 bg-primary/20 rounded-full mb-8" />
                                
                                <h2 className="text-3xl font-black uppercase tracking-widest italic text-foreground/80">Academic Report Card</h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="outline" className="text-[11px] uppercase font-black tracking-widest border-primary/30 bg-primary/5 text-primary px-4 py-1">
                                        Session {academicYear}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] uppercase font-black tracking-widest border-indigo-500/30 bg-indigo-500/5 text-indigo-600 px-4 py-1">
                                        {termName} Examination
                                    </Badge>
                                </div>
                            </div>

                            {/* Student Data */}
                            <div className="grid grid-cols-2 gap-y-6 gap-x-16 mb-12">
                                <div className="flex flex-col gap-1 border-b pb-3 border-border/40">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Student Name</span>
                                    <span className="font-black text-xl uppercase tracking-tight italic">{student.full_name}</span>
                                </div>
                                <div className="flex flex-col gap-1 border-b pb-3 border-border/40">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Roll Number</span>
                                    <span className="font-black text-xl uppercase tracking-tight italic">{student.roll_number}</span>
                                </div>
                                <div className="flex flex-col gap-1 border-b pb-3 border-border/40">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Grade / Class</span>
                                    <span className="font-black text-xl uppercase tracking-tight italic">{className}</span>
                                </div>
                                <div className="flex flex-col gap-1 border-b pb-3 border-border/40">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date of Report</span>
                                    <span className="font-black text-xl uppercase tracking-tight italic">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>

                            {/* Marks Table */}
                            <div className="rounded-3xl border border-border/40 overflow-hidden bg-muted/5 mb-12 shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30 border-b">
                                        <tr>
                                            <th className="py-5 px-6 text-left font-black uppercase text-[11px] tracking-widest text-muted-foreground/70">#</th>
                                            <th className="py-5 px-6 text-left font-black uppercase text-[11px] tracking-widest text-muted-foreground/70">Subject</th>
                                            <th className="py-5 px-6 text-center font-black uppercase text-[11px] tracking-widest text-muted-foreground/70">Total</th>
                                            <th className="py-5 px-6 text-center font-black uppercase text-[11px] tracking-widest text-muted-foreground/70">Obtained</th>
                                            <th className="py-5 px-6 text-center font-black uppercase text-[11px] tracking-widest text-muted-foreground/70">%</th>
                                            <th className="py-5 px-6 text-right font-black uppercase text-[11px] tracking-widest text-muted-foreground/70">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {results.map((r, i) => (
                                            <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="py-4 px-6 font-mono text-[11px] font-bold text-muted-foreground/40">{String(i+1).padStart(2, '0')}</td>
                                                <td className="py-4 px-6 font-black uppercase tracking-tight">
                                                    {r.subjects.name}
                                                    {r.subjects.code && <span className="ml-2 text-[9px] font-mono text-muted-foreground font-normal">[{r.subjects.code}]</span>}
                                                </td>
                                                <td className="py-4 px-6 text-center font-bold text-muted-foreground/60">{r.total_marks}</td>
                                                <td className="py-4 px-6 text-center font-black text-lg">{r.obtained_marks}</td>
                                                <td className="py-4 px-6 text-center font-bold">{r.percentage.toFixed(1)}%</td>
                                                <td className="py-4 px-6 text-right">
                                                    <Badge className={cn("rounded-lg font-black italic border-none shadow-sm", GRADE_COLORS[r.grade] || "bg-muted text-muted-foreground")}>
                                                        {r.grade}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Totals */}
                            <div className="grid grid-cols-3 gap-6 mb-16">
                                <div className="bg-muted/20 p-6 rounded-[2rem] border border-border/40 flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Score</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black italic tracking-tighter text-foreground">{summary.totalObtained}</span>
                                        <span className="text-sm font-bold text-muted-foreground">/ {summary.totalMax}</span>
                                    </div>
                                </div>
                                <div className="bg-muted/20 p-6 rounded-[2rem] border border-border/40 flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Overall Percentage</span>
                                    <span className="text-3xl font-black italic tracking-tighter text-foreground">{summary.percentage.toFixed(1)}%</span>
                                </div>
                                <div className={cn(
                                    "p-6 rounded-[2rem] border flex flex-col items-center gap-1",
                                    summary.isPassed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                                )}>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Final Status</span>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-3xl font-black italic tracking-tighter", summary.isPassed ? "text-emerald-600" : "text-red-600")}>
                                            {summary.isPassed ? 'PASS' : 'FAIL'}
                                        </span>
                                        <Badge className={cn("rounded-lg font-black h-8 w-8 flex items-center justify-center border-none", summary.isPassed ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                                            {summary.finalGrade}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-20 pt-16 px-10 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-full h-px bg-muted-foreground/30 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">Class Teacher</span>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-full h-px bg-muted-foreground/30 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">Principal / Controller</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* HIDDEN PRINTABLE PORTAL */}
            {mounted && open && document.body && createPortal(
                <div id="printable-report-card" className="hidden print:block bg-white w-full">
                    <style dangerouslySetInnerHTML={{ __html: `
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 0;
                            }
                            body > *:not(#printable-report-card) {
                                display: none !important;
                            }
                            #printable-report-card {
                                display: block !important;
                                position: static !important;
                                width: 100% !important;
                                background: white !important;
                                padding: 20mm !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            #printable-report-card * {
                                color: black !important;
                                border-color: black !important;
                            }
                        }
                    `}} />
                    
                    <div className="border-[6px] border-double border-black p-10 bg-white min-h-[297mm]">
                        {/* Header */}
                        <div className="text-center border-b-2 border-black pb-6 mb-8">
                            <h1 className="text-4xl font-black uppercase tracking-tight mb-1">{SCHOOL_NAME}</h1>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-1">{SCHOOL_ADDRESS}</p>
                            <p className="text-[10px] font-bold tracking-[0.2em] mb-4">{SCHOOL_PHONE}</p>
                            <h2 className="text-2xl font-bold uppercase tracking-widest underline decoration-double">Progress Report</h2>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-10 mb-8 text-sm">
                            <div className="flex justify-between border-b border-black">
                                <span className="font-bold">Student Name:</span>
                                <span className="uppercase">{student.full_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-black">
                                <span className="font-bold">Roll Number:</span>
                                <span>{student.roll_number}</span>
                            </div>
                            <div className="flex justify-between border-b border-black">
                                <span className="font-bold">Class / Grade:</span>
                                <span>{className}</span>
                            </div>
                            <div className="flex justify-between border-b border-black">
                                <span className="font-bold">Exam Session:</span>
                                <span>{academicYear}</span>
                            </div>
                            <div className="flex justify-between border-b border-black">
                                <span className="font-bold">Exam Term:</span>
                                <span className="uppercase">{termName}</span>
                            </div>
                            <div className="flex justify-between border-b border-black">
                                <span className="font-bold">Issue Date:</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="w-full border-collapse border-2 border-black mb-10 text-sm">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-black p-2 text-left font-black uppercase text-[10px]">#</th>
                                    <th className="border border-black p-2 text-left font-black uppercase text-[10px]">Subject Name</th>
                                    <th className="border border-black p-2 text-center font-black uppercase text-[10px]">Total</th>
                                    <th className="border border-black p-2 text-center font-black uppercase text-[10px]">Obtained</th>
                                    <th className="border border-black p-2 text-center font-black uppercase text-[10px]">Percentage</th>
                                    <th className="border border-black p-2 text-center font-black uppercase text-[10px]">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={r.id}>
                                        <td className="border border-black p-2 text-center font-mono text-[10px]">{i+1}</td>
                                        <td className="border border-black p-2 font-bold uppercase">{r.subjects.name}</td>
                                        <td className="border border-black p-2 text-center">{r.total_marks}</td>
                                        <td className="border border-black p-2 text-center font-bold text-base">{r.obtained_marks}</td>
                                        <td className="border border-black p-2 text-center font-semibold">{r.percentage.toFixed(1)}%</td>
                                        <td className="border border-black p-2 text-center font-black italic">{r.grade}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 font-black">
                                    <td colSpan={2} className="border border-black p-3 text-right uppercase text-xs">Total Aggregates:</td>
                                    <td className="border border-black p-3 text-center">{summary.totalMax}</td>
                                    <td className="border border-black p-3 text-center text-lg">{summary.totalObtained}</td>
                                    <td className="border border-black p-3 text-center">{summary.percentage.toFixed(1)}%</td>
                                    <td className="border border-black p-3 text-center text-lg italic">{summary.finalGrade}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Remarks */}
                        <div className="border-2 border-black p-4 mb-12">
                            <p className="font-bold uppercase text-[10px] tracking-widest mb-2 underline">General Remarks:</p>
                            <p className="italic text-sm">
                                {summary.isPassed 
                                    ? `Congratulations! ${student.full_name} has successfully passed the examination with an overall score of ${summary.percentage.toFixed(1)}%. Keep up the good work.` 
                                    : `${student.full_name} needs improvement in several subjects. Please contact the class teacher for further discussion.`
                                }
                            </p>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-32 px-10 text-center mt-20">
                            <div className="border-t border-black pt-2 font-bold uppercase text-xs">Class Teacher Signature</div>
                            <div className="border-t border-black pt-2 font-bold uppercase text-xs">Principal's Signature</div>
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <p className="text-[8px] font-medium opacity-60 uppercase tracking-widest">
                                Computer Generated Report | {SCHOOL_NAME} | Date: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
