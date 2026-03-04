'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Printer, ChevronLeft, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';

import { useGetReportCard } from '../api/use-report-card';
import { PageTransition } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Grade badge colors for screen view (will strip for print to save ink)
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
    const studentId = params.studentId as string;
    const examId = params.examId as string;

    const { data: report, isLoading } = useGetReportCard(studentId, examId);

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

    const { student, exam, marks, summary } = report;

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto pb-20">

                {/* ── Screen Only Actions ── */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <Button variant="outline" onClick={() => router.back()} className="gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Marks
                    </Button>
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" /> Print Report Card
                    </Button>
                </div>

                {/* ── Printable Area ── */}
                <div className="print-area bg-card text-card-foreground border rounded-2xl p-8 sm:p-12 shadow-sm">

                    {/* Header */}
                    <div className="flex flex-col items-center justify-center text-center mb-10 pb-8 border-b-2">
                        <img src="/logo.png" alt="School Logo" className="w-20 h-20 object-contain mb-4" />
                        <h1 className="text-3xl font-black uppercase tracking-wider">Academics Report Card</h1>
                        <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-sm">
                            Session 2026-2027
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
                            <span className="font-bold text-base">{student.classes.name} — {student.classes.section}</span>
                        </div>
                        <div className="flex items-end justify-between border-b pb-1">
                            <span className="text-muted-foreground font-medium">Exam Session</span>
                            <span className="font-bold text-base">{exam.title}</span>
                        </div>
                    </div>

                    {/* Marks Table */}
                    <div className="mb-10">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b-2 border-primary/20 bg-muted/30">
                                    <th className="text-left font-bold p-3">Subject</th>
                                    <th className="text-center font-bold p-3 w-28">Total Marks</th>
                                    <th className="text-center font-bold p-3 w-28">Obtained</th>
                                    <th className="text-center font-bold p-3 w-24">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {marks.map((m) => (
                                    <tr key={m.id}>
                                        <td className="p-3 font-medium">{m.subjects.name}</td>
                                        <td className="p-3 text-center text-muted-foreground">{m.total_marks}</td>
                                        <td className="p-3 text-center font-semibold">{m.marks_obtained}</td>
                                        <td className="p-3 text-center">
                                            <Badge className={`print:border-none print:shadow-none print:text-foreground print:bg-transparent ${GRADE_COLORS[m.grade] ?? ''}`}>
                                                {m.grade}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Boxes */}
                    <div className="flex gap-6 mb-16">
                        <div className="flex-1 bg-muted/40 p-5 rounded-xl border flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Total Score</span>
                            <span className="text-xl font-black">{summary.totalObtainedMarks} <span className="text-sm font-medium text-muted-foreground">/ {summary.totalMaxMarks}</span></span>
                        </div>
                        <div className="flex-1 bg-muted/40 p-5 rounded-xl border flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Percentage</span>
                            <span className="text-xl font-black">{summary.percentage}%</span>
                        </div>
                        <div className="flex-1 bg-primary/5 p-5 rounded-xl border border-primary/20 flex items-center justify-between">
                            <span className="font-semibold text-primary">Final Grade</span>
                            <span className="text-2xl font-black text-primary">
                                {marks.length > 0 ? (Number(summary.percentage) >= 85 ? 'A' : Number(summary.percentage) >= 70 ? 'B' : Number(summary.percentage) >= 55 ? 'C' : Number(summary.percentage) >= 40 ? 'D' : 'F') : 'N/A'}
                            </span>
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
