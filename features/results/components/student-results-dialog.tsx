import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetTerms, useGetSubjectsByClass, useGetStudentResults, useUpsertResults, useGetStudentDetails } from '../hooks/use-results';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculateGradeAndPercentage } from '../schemas/results.schema';
import { AlertCircle, BookOpen, Loader2, Save, Printer, ArrowLeft, School, LayoutGrid } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StudentResultsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: { id: string; full_name: string; roll_number: string; photo_url: string };
    termId: string;
    classId: string;
    isReadOnly?: boolean;
}

export function StudentResultsDialog({ open, onOpenChange, student, termId, classId, isReadOnly = false }: StudentResultsDialogProps) {
    const { data: terms } = useGetTerms();
    const { data: subjects, isLoading: subjectsLoading } = useGetSubjectsByClass(classId);
    const { data: results, isLoading: resultsLoading } = useGetStudentResults(termId, student.id);
    const { data: fullStudentInfo } = useGetStudentDetails(student.id);
    const upsertMutation = useUpsertResults();

    const [marks, setMarks] = useState<Record<string, { obtained: number; total: number }>>({});
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    const currentTerm = terms?.find(t => t.id === termId);
    const studentDetail = fullStudentInfo || results?.[0]?.students || student;

    useEffect(() => {
        if (results && subjects) {
            const initialMarks: Record<string, { obtained: number; total: number }> = {};
            subjects.forEach(sub => {
                initialMarks[sub.id] = { obtained: 0, total: 100 };
            });
            results.forEach(res => {
                initialMarks[res.subject_id] = { obtained: res.obtained_marks, total: res.total_marks };
            });
            setMarks(initialMarks);
        }
    }, [results, subjects]);

    const handlePrint = () => {
        window.print();
    };

    const handleMarkChange = (subjectId: string, field: 'obtained' | 'total', value: string) => {
        if (isReadOnly) return;
        let numValue = parseFloat(value) || 0;
        
        setMarks(prev => {
            const currentSub = prev[subjectId] || { obtained: 0, total: 100 };
            
            // Enforce obtained marks <= total marks constraint
            if (field === 'obtained') {
                numValue = Math.min(Math.max(0, numValue), currentSub.total);
            } else if (field === 'total') {
                numValue = Math.max(numValue, currentSub.obtained);
            }
            
            return {
                ...prev,
                [subjectId]: {
                    ...currentSub,
                    [field]: numValue
                }
            };
        });
    };

    const handleSave = async () => {
        const resultEntries = (subjects ?? []).map(subject => {
            const subjectMarks = marks[subject.id] || { obtained: 0, total: 100 };
            const { percentage, grade } = calculateGradeAndPercentage(subjectMarks.obtained, subjectMarks.total);
            return {
                term_id: termId,
                student_id: student.id,
                subject_id: subject.id,
                obtained_marks: subjectMarks.obtained,
                total_marks: subjectMarks.total,
                grade: grade,
                percentage: percentage
            };
        });

        upsertMutation.mutate(resultEntries, {
            onSuccess: () => onOpenChange(false)
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="!max-w-none !w-screen !h-screen !m-0 !rounded-none border-none bg-background p-0 overflow-hidden shadow-2xl flex flex-col no-print">
                    <DialogHeader className="p-8 pb-4 bg-muted/20 border-b border-border/40 shrink-0 no-print">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <Avatar className="h-16 w-16 border-4 border-primary/20 shadow-xl transition-transform group-hover:scale-105 duration-500">
                                    <AvatarImage src={student.photo_url} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                                        {student.full_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-background flex items-center justify-center shadow-lg ${isReadOnly ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                                    {isReadOnly ? <BookOpen className="w-3 h-3 text-white" /> : <Save className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-foreground/90">
                                    {isReadOnly ? 'Student Result View' : 'Performance Entry Portal'}
                                </DialogTitle>
                                <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-3 mt-1">
                                    <span className="text-foreground">{student.full_name}</span>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                    <span>{currentTerm?.name} ({currentTerm?.academic_year})</span>
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isReadOnly && (
                                <Button
                                    variant="outline"
                                    className="rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[10px] gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground transition-all"
                                    onClick={handlePrint}
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Result
                                </Button>
                            )}
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

                <div className="p-8 pt-6 overflow-y-auto flex-1 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent no-print">
                    <div className="max-w-5xl mx-auto space-y-8">
                        {subjectsLoading || resultsLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">Synchronizing Academic Records...</p>
                            </div>
                        ) : !subjects?.length ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground/40 italic">
                                <div className="h-20 w-20 rounded-[2rem] bg-muted/50 flex items-center justify-center shadow-lg">
                                    <BookOpen className="h-10 w-10 opacity-20" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-sm uppercase tracking-widest">No subjects defined</p>
                                    <p className="text-[10px] mt-1 font-medium opacity-60">Please configure the curriculum for this class.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="rounded-[2rem] border border-border/40 overflow-hidden bg-background shadow-2xl">
                                    <Table>
                                        <TableHeader className="bg-muted/50 border-b-2 border-border">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="py-6 px-8 font-black uppercase text-[11px] tracking-widest">Subject Curriculum</TableHead>
                                                <TableHead className="text-center font-black uppercase text-[11px] tracking-widest">Score Obtained</TableHead>
                                                <TableHead className="text-center font-black uppercase text-[11px] tracking-widest">Maximum Marks</TableHead>
                                                <TableHead className="text-right py-6 px-8 font-black uppercase text-[11px] tracking-widest">Evaluation</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subjects.map((subject) => {
                                                const subjectMarks = marks[subject.id] || { obtained: 0, total: 100 };
                                                const { percentage, grade } = calculateGradeAndPercentage(subjectMarks.obtained, subjectMarks.total);
                                                
                                                return (
                                                    <TableRow key={subject.id} className="hover:bg-primary/5 border-b border-border/40 group transition-all duration-300">
                                                        <TableCell className="py-5 px-8">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-base italic uppercase tracking-tight group-hover:text-primary transition-colors">
                                                                    {subject.name}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest font-mono">{subject.code || 'CORE-SUB'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-center">
                                                                {isReadOnly ? (
                                                                    <span className="text-xl font-black italic">{subjectMarks.obtained}</span>
                                                                ) : (
                                                                    <Input 
                                                                        type="number" 
                                                                        className="w-28 text-center font-black rounded-xl border-border/50 h-12 bg-background/50 focus:ring-primary/20 focus:border-primary/40 transition-all text-base shadow-inner"
                                                                        value={subjectMarks.obtained}
                                                                        onChange={(e) => handleMarkChange(subject.id, 'obtained', e.target.value)}
                                                                    />
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-center">
                                                                {isReadOnly ? (
                                                                    <span className="text-xl font-black italic opacity-40">{subjectMarks.total}</span>
                                                                ) : (
                                                                    <Input 
                                                                        type="number" 
                                                                        className="w-28 text-center font-black rounded-xl border-border/50 h-12 bg-background/50 focus:ring-primary/20 focus:border-primary/40 transition-all text-base shadow-inner"
                                                                        value={subjectMarks.total}
                                                                        onChange={(e) => handleMarkChange(subject.id, 'total', e.target.value)}
                                                                    />
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-5 px-8">
                                                            <div className="flex flex-col items-end">
                                                                <Badge className={`rounded-lg px-3 py-1 text-[11px] font-black uppercase tracking-widest mb-1 border-none ${
                                                                    percentage >= 85 ? 'bg-emerald-500 text-white shadow-lg' :
                                                                    percentage >= 70 ? 'bg-blue-500 text-white shadow-lg' :
                                                                    percentage >= 40 ? 'bg-orange-500 text-white shadow-lg' :
                                                                    'bg-red-500 text-white shadow-lg'
                                                                }`}>
                                                                    Grade {grade}
                                                                </Badge>
                                                                <span className="text-xs font-black text-foreground/30 font-mono tracking-tighter italic">{percentage.toFixed(1)}%</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}

                                            {/* Final Summary Card-like Row */}
                                            {subjects.length > 0 && (
                                                <TableRow className="bg-muted/10 hover:bg-muted/20 transition-colors border-t-4 border-foreground overflow-hidden">
                                                    <TableCell className="py-8 px-8">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-3xl italic uppercase tracking-tighter text-foreground">Grand Result</span>
                                                            <Badge variant="outline" className="w-fit text-[10px] uppercase font-black tracking-[0.2em] mt-2 border-foreground/10 bg-background/50">Cumulative Standing</Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-4xl font-black italic text-foreground tracking-tighter leading-none">
                                                                {subjects.reduce((sum, sub) => sum + (marks[sub.id]?.obtained || 0), 0)}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] italic opacity-40">Obtained</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-4xl font-black italic text-foreground/40 tracking-tighter leading-none">
                                                                {subjects.reduce((sum, sub) => sum + (marks[sub.id]?.total || 100), 0)}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] italic opacity-40">Possible</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-8 px-8">
                                                        {(() => {
                                                            const totalObtained = subjects.reduce((sum, sub) => sum + (marks[sub.id]?.obtained || 0), 0);
                                                            const totalMax = subjects.reduce((sum, sub) => sum + (marks[sub.id]?.total || 100), 0);
                                                            const { percentage, grade } = calculateGradeAndPercentage(totalObtained, totalMax);
                                                            const isPassed = percentage >= 40;

                                                            return (
                                                                <div className="flex items-center justify-end gap-8">
                                                                    <div className="flex flex-col items-end">
                                                                        <Badge className={`rounded-[1rem] px-6 py-2 text-sm font-black uppercase tracking-[0.2em] italic shadow-2xl border-none ${
                                                                            isPassed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                                                        }`}>
                                                                            {isPassed ? 'PROMOTED' : 'DETAINED'}
                                                                        </Badge>
                                                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-2">{percentage.toFixed(2)}% SCORE</span>
                                                                    </div>
                                                                    <div className="h-16 w-px bg-foreground/10 mx-2" />
                                                                    <div className="flex flex-col items-end min-w-[80px]">
                                                                        <span className={`text-6xl font-black italic tracking-tighter leading-none ${isPassed ? 'text-primary' : 'text-red-500'}`}>
                                                                            {grade}
                                                                        </span>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1 italic">FINAL Rank</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {!isReadOnly && (
                                    <div className="flex items-center justify-between p-8 rounded-[2rem] bg-orange-500/5 border border-orange-500/20 shadow-xl">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <AlertCircle className="w-7 h-7 text-orange-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-black uppercase tracking-widest text-orange-700 italic">Data Integrity Warning</span>
                                                <p className="text-xs font-medium text-orange-900/40 italic">You are currently in editing mode. Changes will overwrite previous archives for this term.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Button 
                                                variant="ghost" 
                                                className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[11px] hover:bg-red-500/10 hover:text-red-600 transition-all text-muted-foreground"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                Abort
                                            </Button>
                                            <Button 
                                                className="rounded-xl px-12 h-16 font-black uppercase tracking-[0.2em] text-xs gap-3 shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all bg-primary transform hover:scale-[1.03] active:scale-95 duration-500 group"
                                                onClick={handleSave}
                                                disabled={upsertMutation.isPending}
                                            >
                                                {upsertMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:rotate-12" />}
                                                Save Result
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* HIDDEN PRINTABLE REPORT CARD - Portaled directly to body to bypass all layout constraints */}
        {mounted && open && document.body && createPortal(
            <div id="printable-report-card" className="font-serif hidden print:block bg-white w-full h-auto">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 10mm; 
                        }
                        body > *:not(#printable-report-card) {
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
                        #printable-report-card {
                            display: block !important;
                            position: static !important;
                            background: white !important;
                            color: black !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        #printable-report-card * {
                            color: black !important;
                            border-color: black !important;
                            visibility: visible !important;
                        }
                        #printable-report-card .text-white, #printable-report-card .text-white * {
                            color: white !important;
                        }
                        #printable-report-card .text-slate-400 {
                            color: #94a3b8 !important;
                        }
                        #printable-report-card .border-slate-300 {
                            border-color: #cbd5e1 !important;
                        }
                        #printable-report-card .border-black\\/10 {
                            border-color: rgba(0,0,0,0.1) !important;
                        }
                        .no-break {
                            page-break-inside: avoid;
                        }
                    }
                    @media screen {
                        #printable-report-card {
                            display: none !important;
                        }
                    }
                `}} />
                    <div className="border-[8px] border-double border-black p-6 h-full flex flex-col box-border">
                        {/* Header Section */}
                        <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-16 rounded-full border-[3px] border-black flex items-center justify-center p-1.5">
                                    <School className="w-10 h-10" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-0.5">AR SCHOOL ERP</h1>
                                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Academic Excellence & Innovation</p>
                                    <p className="text-[9px] italic">Main Campus, High Street, City Road</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-0.5">Report Card</h1>
                                <p className="text-base font-bold uppercase tracking-widest">{currentTerm?.name || 'Academic Term'}</p>
                                <p className="text-[10px] font-medium italic opacity-60">Session: {currentTerm?.academic_year || '2025-26'}</p>
                            </div>
                        </div>

                        {/* Student Details Section */}
                        <div className="grid grid-cols-12 gap-6 mb-6 items-start">
                            <div className="col-span-3">
                                <div className="h-40 w-full rounded-lg border-2 border-black overflow-hidden shadow-sm">
                                    {studentDetail?.photo_url ? (
                                        <img src={studentDetail.photo_url} className="h-full w-full object-cover" alt="Student" />
                                    ) : (
                                        <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                            <LayoutGrid className="w-10 h-10 opacity-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 border-2 border-black bg-slate-50 p-1.5 text-center rounded-md">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Roll Number</p>
                                    <p className="text-xl font-black tracking-tighter leading-none">{studentDetail?.roll_number || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="col-span-9 grid grid-cols-2 gap-y-4 gap-x-8 px-5 py-4 bg-slate-50/50 rounded-xl border border-slate-300">
                                <div className="flex flex-col border-b border-slate-300 pb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student's Name</span>
                                    <span className="text-lg font-black uppercase tracking-tight leading-tight">{studentDetail?.full_name}</span>
                                </div>
                                <div className="flex flex-col border-b border-slate-300 pb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Father's/Guardian's Name</span>
                                    <span className="text-lg font-black uppercase tracking-tight leading-tight">{studentDetail?.users?.full_name || 'NOT SPECIFIED'}</span>
                                </div>
                                <div className="flex flex-col border-b border-slate-300 pb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class & Section</span>
                                    <span className="text-lg font-black uppercase tracking-tight leading-tight">
                                        CLASS: {studentDetail?.class_id?.slice(0, 4).toUpperCase() || 'N/A'} | SEC: A
                                    </span>
                                </div>
                                <div className="flex flex-col border-b border-slate-300 pb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Session</span>
                                    <span className="text-lg font-black uppercase tracking-tight leading-tight">{currentTerm?.academic_year || '2025-26'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Marks Table Section */}
                        <div className="flex-1 overflow-hidden">
                            <table className="w-full border-collapse border-2 border-black">
                                <thead>
                                    <tr className="bg-black text-white">
                                        <th className="border border-white/20 py-2.5 px-4 text-left uppercase text-[10px] tracking-widest font-black">S.N</th>
                                        <th className="border border-white/20 py-2.5 px-4 text-left uppercase text-[10px] tracking-widest font-black">Subject Description</th>
                                        <th className="border border-white/20 py-2.5 px-4 text-center uppercase text-[10px] tracking-widest font-black">Max Marks</th>
                                        <th className="border border-white/20 py-2.5 px-4 text-center uppercase text-[10px] tracking-widest font-black">Observed Score</th>
                                        <th className="border border-white/20 py-2.5 px-4 text-right uppercase text-[10px] tracking-widest font-black">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects?.map((sub, idx) => {
                                        const subjectMarks = marks[sub.id] || { obtained: 0, total: 100 };
                                        const { grade } = calculateGradeAndPercentage(subjectMarks.obtained, subjectMarks.total);
                                        return (
                                            <tr key={sub.id} className="border-b border-black/10">
                                                <td className="border border-black/10 py-2 px-4 text-center font-bold text-sm font-mono">{idx + 1}</td>
                                                <td className="border border-black/10 py-2 px-4 font-black uppercase tracking-tight text-sm">{sub.name}</td>
                                                <td className="border border-black/10 py-2 px-4 text-center font-bold text-sm">{subjectMarks.total}</td>
                                                <td className="border border-black/10 py-2 px-4 text-center font-black text-sm">{subjectMarks.obtained}</td>
                                                <td className="border border-black/10 py-2 px-4 text-right font-black italic text-sm">{grade}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 font-black border-t-2 border-black">
                                        <td colSpan={2} className="py-2.5 px-4 uppercase tracking-widest text-[11px] italic">Combined Evaluation Summary</td>
                                        <td className="py-2.5 px-4 text-center text-lg">
                                            {subjects?.reduce((sum, sub) => sum + (marks[sub.id]?.total || 100), 0)}
                                        </td>
                                        <td className="py-2.5 px-4 text-center text-lg">
                                            {subjects?.reduce((sum, sub) => sum + (marks[sub.id]?.obtained || 0), 0)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                            {(() => {
                                                const totalObtained = subjects?.reduce((sum, sub) => sum + (marks[sub.id]?.obtained || 0), 0) || 0;
                                                const totalMax = subjects?.reduce((sum, sub) => sum + (marks[sub.id]?.total || 100), 0) || 100;
                                                const { percentage, grade } = calculateGradeAndPercentage(totalObtained, totalMax);
                                                return (
                                                    <div className="flex flex-col items-end leading-none">
                                                        <span className="text-2xl font-black italic leading-none">{grade}</span>
                                                        <span className="text-[9px] tracking-tighter opacity-50 uppercase mt-0.5">{percentage.toFixed(1)}% Score</span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Signatures Section */}
                        <div className="grid grid-cols-3 gap-10 mt-8 items-end no-break">
                            <div className="text-center">
                                <div className="h-px bg-slate-300 w-full mb-3" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Guardian Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="h-px bg-slate-300 w-full mb-3" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Faculty In-charge</p>
                            </div>
                            <div className="text-center">
                                <div className="mb-3 h-10 flex items-center justify-center overflow-hidden opacity-5 grayscale">
                                    <p className="text-3xl font-serif font-black italic tracking-widest">PRINCIPAL</p>
                                </div>
                                <div className="h-px bg-black w-full mb-3" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/60">Official Signature</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-3 border-t border-dashed border-slate-300 flex justify-between items-end">
                            <p className="text-[8px] font-medium italic opacity-40 uppercase tracking-widest">Generated by AR-ERP System | Date: {new Date().toLocaleDateString()}</p>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 border border-slate-200 rounded flex items-center justify-center p-0.5 opacity-40">
                                    <div className="h-full w-full bg-slate-900 rounded-[1px]" />
                                </div>
                                <p className="text-[8px] font-black uppercase tracking-widest leading-none text-slate-400">Institutional<br />Archive Seal</p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
