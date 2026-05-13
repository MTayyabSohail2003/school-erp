'use client';

import { useParams, useRouter } from 'next/navigation';
import { Printer, ChevronLeft } from 'lucide-react';

import { useGetReportCard } from '../api/use-report-card';
import { PageTransition } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE } from '@/constants/school-identity';

const GRADE_COLORS: Record<string, string> = {
    A: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    B: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    C: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    D: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    F: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
};

export function ReportCardPage() {
    const params = useParams();
    const router = useRouter();
    // Route: /students/[studentId]/report-card/[termId]
    const studentId = params.studentId as string;
    const termId = params.termId as string;

    const { data: report, isLoading } = useGetReportCard(studentId, termId);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Report card not found.</p>
                <Button variant="link" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const { student, term, results, summary } = report;

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto pb-20">

                {/* ── Screen-Only Actions ── */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <Button variant="outline" onClick={() => router.back()} className="gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" /> Print Report Card
                    </Button>
                </div>

                {/* ── Printable Area ── */}
                <div className="print-area bg-card text-card-foreground border rounded-2xl p-8 sm:p-12 shadow-sm">

                    {/* Header */}
                    <div className="flex flex-col items-center justify-center text-center mb-10 pb-8 border-b-2">
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{SCHOOL_NAME}</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">
                            {SCHOOL_ADDRESS} &bull; {SCHOOL_PHONE}
                        </p>
                        
                        <div className="h-px w-20 bg-primary/20 mb-6" />
                        
                        <h2 className="text-2xl font-black uppercase tracking-wider">Academic Report Card</h2>
                        <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-sm">
                            Session {term.academic_year}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 font-semibold uppercase tracking-widest">
                            {term.name} Examination
                        </p>
                    </div>

                    {/* Student Info Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-10 text-sm">
                        <div className="flex items-end justify-between border-b pb-1">
                            <span className="text-muted-foreground font-medium">Student Name</span>
                            <span className="font-bold text-base">{student.full_name}</span>
                        </div>
                        <div className="flex items-end justify-between border-b pb-1">
                            <span className="text-muted-foreground font-medium">Roll Number</span>
                            <span className="font-bold text-base">{student.roll_number}</span>
                        </div>
                        <div className="flex items-end justify-between border-b pb-1">
                            <span className="text-muted-foreground font-medium">Class / Section</span>
                            <span className="font-bold text-base">
                                {student.classes?.name} — {student.classes?.section}
                            </span>
                        </div>
                        <div className="flex items-end justify-between border-b pb-1">
                            <span className="text-muted-foreground font-medium">Exam Term</span>
                            <span className="font-bold text-base">{term.name}</span>
                        </div>
                    </div>

                    {/* Marks Table */}
                    <div className="mb-10">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b-2 border-primary/20 bg-muted/30">
                                    <th className="text-left font-bold p-3">#</th>
                                    <th className="text-left font-bold p-3">Subject</th>
                                    <th className="text-center font-bold p-3 w-28">Total Marks</th>
                                    <th className="text-center font-bold p-3 w-28">Obtained</th>
                                    <th className="text-center font-bold p-3 w-20">%</th>
                                    <th className="text-center font-bold p-3 w-20">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted-foreground italic text-sm">
                                            No results recorded for this term.
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((r, i) => (
                                        <tr key={r.id ?? i}>
                                            <td className="p-3 text-muted-foreground text-xs font-mono">
                                                {String(i + 1).padStart(2, '0')}
                                            </td>
                                            <td className="p-3 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{r.subjects?.name}</span>
                                                    {r.subjects?.code && (
                                                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                                                            {r.subjects.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center text-muted-foreground">{r.total_marks}</td>
                                            <td className="p-3 text-center font-semibold">{r.obtained_marks}</td>
                                            <td className="p-3 text-center text-sm font-bold">
                                                {Number(r.percentage).toFixed(1)}%
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge className={cn(
                                                    'print:border-none print:shadow-none print:text-foreground print:bg-transparent',
                                                    GRADE_COLORS[r.grade] ?? ''
                                                )}>
                                                    {r.grade}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Boxes */}
                    <div className="flex gap-6 mb-16">
                        <div className="flex-1 bg-muted/40 p-5 rounded-xl border flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Total Score</span>
                            <span className="text-xl font-black">
                                {summary.totalObtainedMarks}{' '}
                                <span className="text-sm font-medium text-muted-foreground">/ {summary.totalMaxMarks}</span>
                            </span>
                        </div>
                        <div className="flex-1 bg-muted/40 p-5 rounded-xl border flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Percentage</span>
                            <span className="text-xl font-black">{summary.percentage.toFixed(1)}%</span>
                        </div>
                        <div className={cn(
                            'flex-1 p-5 rounded-xl border flex items-center justify-between',
                            summary.isPassed
                                ? 'bg-primary/5 border-primary/20'
                                : 'bg-red-500/5 border-red-500/20'
                        )}>
                            <span className={cn('font-semibold', summary.isPassed ? 'text-primary' : 'text-red-600')}>
                                Final Grade
                            </span>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    'text-2xl font-black',
                                    summary.isPassed ? 'text-primary' : 'text-red-600'
                                )}>
                                    {summary.finalGrade}
                                </span>
                                <Badge className={cn(
                                    'font-black text-xs border-none',
                                    summary.isPassed
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-red-500 text-white'
                                )}>
                                    {summary.isPassed ? 'PASS' : 'FAIL'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between mt-20 pt-10 px-8 text-center text-sm font-semibold text-muted-foreground">
                        <div className="w-48 border-t-2 border-muted-foreground pt-2">Class Teacher</div>
                        <div className="w-48 border-t-2 border-muted-foreground pt-2">Principal</div>
                    </div>

                </div>
            </div>
        </PageTransition>
    );
}
