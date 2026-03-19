'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardList, Save, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';

import { useGetExams } from '@/features/exams/api/use-exams';
import { useGetSubjects } from '@/features/exams/api/use-subjects';
import { useTeacherClasses } from '@/features/classes/hooks/use-teacher-classes';
import { useGetMarks, useUpsertMarks } from '../api/use-marks';
import { calculateGrade, type MarkEntry } from '../schemas/mark.schema';
import { useStudentsByClass } from '@/features/students/hooks/use-students-by-class';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';

// Grade badge colors
const GRADE_COLORS: Record<string, string> = {
    A: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    B: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    C: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    D: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    F: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
};

export function MarkSheetPage() {
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // marksMap: { [student_id:subject_id]: { obtained, total } }
    const [marksMap, setMarksMap] = useState<Record<string, { obtained: number; total: number }>>({});

    const { data: exams } = useGetExams();
    const { data: classes } = useTeacherClasses();
    const { data: subjects } = useGetSubjects(selectedClassId);
    const { data: students } = useStudentsByClass(selectedClassId);
    const { data: existingMarks, isLoading: marksLoading } = useGetMarks(selectedExamId, selectedClassId);
    const upsertMutation = useUpsertMarks(selectedExamId, selectedClassId);

    // When existing marks load, pre-fill the map
    const key = (sid: string, subId: string) => `${sid}:${subId}`;

    const getOrDefault = (studentId: string, subjectId: string) => {
        const mapKey = key(studentId, subjectId);
        if (marksMap[mapKey]) return marksMap[mapKey];
        const existing = existingMarks?.find(
            (m) => m.student_id === studentId && m.subject_id === subjectId
        );
        return existing
            ? { obtained: existing.marks_obtained, total: existing.total_marks }
            : { obtained: 0, total: 100 };
    };

    const updateMark = (
        studentId: string,
        subjectId: string,
        field: 'obtained' | 'total',
        value: number
    ) => {
        const mapKey = key(studentId, subjectId);
        setMarksMap((prev) => ({
            ...prev,
            [mapKey]: { ...getOrDefault(studentId, subjectId), [field]: value },
        }));
    };

    const handleSave = () => {
        if (!selectedExamId || !selectedClassId || !students || !subjects) return;

        const records: MarkEntry[] = [];
        students.forEach((student) => {
            subjects.forEach((subject) => {
                const { obtained, total } = getOrDefault(student.id, subject.id);
                records.push({
                    exam_id: selectedExamId,
                    student_id: student.id,
                    subject_id: subject.id,
                    marks_obtained: obtained,
                    total_marks: total,
                    grade: calculateGrade(obtained, total),
                });
            });
        });

        upsertMutation.mutate(records, {
            onSuccess: () => toast.success('Marks saved successfully!'),
            onError: (err) => toast.error(err.message),
        });
    };

    const readyToShow = selectedExamId && selectedClassId && students && subjects && subjects.length > 0 && students.length > 0;

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Mark Sheet</h1>
                            <p className="text-sm text-muted-foreground">Enter student marks per subject</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={!readyToShow || upsertMutation.isPending}
                        className="gap-2"
                    >
                        {upsertMutation.isPending
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Save className="h-4 w-4" />}
                        Save Marks
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exam</Label>
                                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                    <SelectTrigger><SelectValue placeholder="Select an exam…" /></SelectTrigger>
                                    <SelectContent>
                                        {(exams ?? []).map((e) => (
                                            <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</Label>
                                <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setMarksMap({}); }}>
                                    <SelectTrigger><SelectValue placeholder="Select a class…" /></SelectTrigger>
                                    <SelectContent>
                                        {(classes ?? []).map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name} — Section {c.section}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Grid */}
                {!selectedExamId || !selectedClassId ? (
                    <p className="text-center text-muted-foreground py-12 text-sm">
                        Select an exam and class to begin entering marks.
                    </p>
                ) : (subjects ?? []).length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground text-sm">
                            No subjects found for this class. Add subjects in Class Settings.
                        </CardContent>
                    </Card>
                ) : marksLoading ? (
                    <Skeleton className="h-48 rounded-xl" />
                ) : (
                    <Card>
                        <CardHeader className="border-b pb-3">
                            <CardTitle className="text-base">
                                {students?.length ?? 0} Students × {subjects?.length ?? 0} Subjects
                            </CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="text-left px-5 py-3 font-semibold text-muted-foreground w-44">Student</th>
                                        {(subjects ?? []).map((sub) => (
                                            <th key={sub.id} className="px-3 py-3 font-semibold text-muted-foreground text-center min-w-[130px]">
                                                {sub.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(students ?? []).map((student, i) => (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-primary w-8">{student.roll_number}</span>
                                                    <span className="font-medium truncate flex-1 min-w-[120px]">{student.full_name}</span>
                                                    <Link href={`/dashboard/marks/report/${student.id}/${selectedExamId}`} target="_blank">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                            {(subjects ?? []).map((subject) => {
                                                const { obtained, total } = getOrDefault(student.id, subject.id);
                                                const grade = calculateGrade(obtained, total);
                                                return (
                                                    <td key={subject.id} className="px-3 py-2.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={total}
                                                                value={obtained}
                                                                onChange={(e) => updateMark(student.id, subject.id, 'obtained', Number(e.target.value))}
                                                                className="h-8 w-16 text-center text-sm px-2"
                                                            />
                                                            <span className="text-muted-foreground text-xs">/</span>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={total}
                                                                onChange={(e) => updateMark(student.id, subject.id, 'total', Number(e.target.value))}
                                                                className="h-8 w-16 text-center text-sm px-2"
                                                            />
                                                            <Badge className={`text-[10px] px-1.5 py-0.5 border ${GRADE_COLORS[grade] ?? ''}`}>
                                                                {grade}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </PageTransition>
    );
}
