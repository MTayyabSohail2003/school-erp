'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetSubjectsByClass, useGetClassResults, useUpsertResults, useGetStudentsByClass } from '../hooks/use-results';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculateGradeAndPercentage } from '../schemas/results.schema';
import { Loader2, Save, BookOpen, AlertCircle, LayoutGrid, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface BulkResultsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    termId: string;
    classId: string;
}

export function BulkResultsDialog({ open, onOpenChange, termId, classId }: BulkResultsDialogProps) {
    const { data: subjects, isLoading: subjectsLoading } = useGetSubjectsByClass(classId);
    const { data: students, isLoading: studentsLoading } = useGetStudentsByClass(classId);
    const { data: existingResults, isLoading: resultsLoading } = useGetClassResults(termId, classId);
    const upsertMutation = useUpsertResults();

    // Matrix: Record<studentId, Record<subjectId, { obtained: number; total: number }>>
    const [matrix, setMatrix] = useState<Record<string, Record<string, { obtained: number; total: number }>>>({});
    const [globalTotal, setGlobalTotal] = useState<number>(100);

    useEffect(() => {
        if (students && subjects && existingResults) {
            const initialMatrix: Record<string, Record<string, { obtained: number; total: number }>> = {};
            
            // Initialize with all students and subjects
            students.forEach(student => {
                initialMatrix[student.id] = {};
                subjects.forEach(subject => {
                    initialMatrix[student.id][subject.id] = { obtained: 0, total: 100 };
                });
            });

            // Overwrite with existing results
            existingResults.forEach((res: any) => {
                if (initialMatrix[res.student_id] && initialMatrix[res.student_id][res.subject_id]) {
                    initialMatrix[res.student_id][res.subject_id] = { 
                        obtained: res.obtained_marks, 
                        total: res.total_marks 
                    };
                }
            });

            setMatrix(initialMatrix);
        }
    }, [students, subjects, existingResults]);

    const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
        let obtained = parseFloat(value) || 0;
        setMatrix(prev => {
            const currentSub = prev[studentId]?.[subjectId];
            if (!currentSub) return prev;
            
            // Enforce constraint obtained <= total
            obtained = Math.min(Math.max(0, obtained), currentSub.total);
            
            return {
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    [subjectId]: {
                        ...currentSub,
                        obtained
                    }
                }
            };
        });
    };

    const handleSubjectTotalChange = (subjectId: string, value: string) => {
        const total = parseInt(value) || 0;
        setMatrix(prev => {
            const newMatrix = { ...prev };
            Object.keys(newMatrix).forEach(studentId => {
                if (newMatrix[studentId][subjectId]) {
                    newMatrix[studentId][subjectId].total = total;
                }
            });
            return newMatrix;
        });
    };

    const handleSave = async () => {
        const allEntries: any[] = [];
        Object.entries(matrix).forEach(([studentId, subjectData]) => {
            Object.entries(subjectData).forEach(([subjectId, marks]) => {
                const { percentage, grade } = calculateGradeAndPercentage(marks.obtained, marks.total);
                allEntries.push({
                    term_id: termId,
                    student_id: studentId,
                    subject_id: subjectId,
                    obtained_marks: marks.obtained,
                    total_marks: marks.total,
                    grade: grade,
                    percentage: percentage
                });
            });
        });

        upsertMutation.mutate(allEntries, {
            onSuccess: () => onOpenChange(false)
        });
    };

    const isLoading = subjectsLoading || studentsLoading || resultsLoading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-none !w-screen !h-screen !m-0 !rounded-none border-none bg-card/60 backdrop-blur-3xl p-0 overflow-hidden shadow-2xl flex flex-col">
                <DialogHeader className="p-8 pb-4 bg-muted/40 border-b border-border/40 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-[2rem] bg-cyan-500/10 flex items-center justify-center border-4 border-cyan-500/20 shadow-xl">
                                <LayoutGrid className="w-8 h-8 text-cyan-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-foreground/90">
                                    Bulk Performance Portal
                                </DialogTitle>
                                <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-2 mt-1">
                                    <Users className="w-4 h-4" />
                                    Class-wide Mark Sheet Management
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-background/40 p-4 rounded-3xl border border-border/40 backdrop-blur-md shadow-inner">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 italic">Set Subject Max Marks</span>
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="number" 
                                        className="w-24 h-11 rounded-xl border-primary/20 bg-background/50 font-black text-center text-primary shadow-sm"
                                        value={globalTotal}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setGlobalTotal(val);
                                            setMatrix(prev => {
                                                const newMatrix = { ...prev };
                                                Object.keys(newMatrix).forEach(studentId => {
                                                    Object.keys(newMatrix[studentId]).forEach(subjectId => {
                                                        newMatrix[studentId][subjectId].total = val;
                                                    });
                                                });
                                                return newMatrix;
                                            });
                                        }}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary/60 uppercase italic">Applied</span>
                                        <span className="text-[9px] font-bold text-muted-foreground opacity-40 uppercase font-mono">To all subjects</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-8 pt-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Class Matrix...</p>
                        </div>
                    ) : !students?.length || !subjects?.length ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground/40 italic">
                             <div className="h-24 w-24 rounded-[2.5rem] bg-muted/50 flex items-center justify-center shadow-lg border border-border/40">
                                <BookOpen className="h-12 w-12 opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg uppercase tracking-widest">Incomplete Setup</p>
                                <p className="text-[10px] mt-1 font-medium opacity-60">Please ensure students and subjects are assigned to this class.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[2.5rem] border border-border/40 bg-background/30 backdrop-blur-sm overflow-hidden shadow-2xl">
                            <Table className="border-collapse">
                                <TableHeader className="bg-muted/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
                                    <TableRow className="hover:bg-transparent border-b-border/40">
                                        <TableHead className="py-6 px-8 font-black uppercase text-[11px] tracking-widest border-r border-border/40 sticky left-0 z-20 bg-muted/80 w-[300px]">Student Identity</TableHead>
                                        {subjects.map(subject => (
                                            <TableHead key={subject.id} className="text-center font-black uppercase text-[11px] tracking-widest min-w-[160px] border-r border-border/40">
                                               <div className="flex flex-col gap-2 items-center justify-center p-2 rounded-2xl bg-primary/5 border border-primary/10">
                                                    <span className="text-primary italic tracking-tight">{subject.name}</span>
                                                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-xl border border-primary/20">
                                                        <span className="text-[8px] font-black opacity-40">MAX</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-12 bg-transparent text-center font-black text-[10px] focus:outline-none text-primary"
                                                            value={Object.values(matrix)[0]?.[subject.id]?.total || 0}
                                                            onChange={(e) => handleSubjectTotalChange(subject.id, e.target.value)}
                                                        />
                                                    </div>
                                               </div>
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right py-6 px-8 font-black uppercase text-[11px] tracking-widest bg-primary/5 sticky right-0 z-20 backdrop-blur-xl w-[250px]">Record Aggregate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map(student => {
                                        const studentMarks = matrix[student.id] || {};
                                        
                                        const totalObtained = Object.values(studentMarks).reduce((sum, m) => sum + m.obtained, 0);
                                        const totalPossible = Object.values(studentMarks).reduce((sum, m) => sum + m.total, 0);
                                        const { percentage, grade } = calculateGradeAndPercentage(totalObtained, totalPossible || 100);
                                        const isPassed = percentage >= 40;

                                        return (
                                            <TableRow key={student.id} className="hover:bg-primary/5 border-b-border/20 group transition-all duration-300">
                                                <TableCell className="py-5 px-8 border-r border-border/40 sticky left-0 z-10 bg-background/80 backdrop-blur-xl group-hover:bg-primary/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                                            <AvatarImage src={student.photo_url} />
                                                            <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">{student.full_name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-sm italic uppercase tracking-tight group-hover:text-primary transition-colors whitespace-nowrap">
                                                                {student.full_name}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-[0.2em] font-mono mt-0.5">
                                                                {student.roll_number}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                
                                                {subjects.map(subject => (
                                                    <TableCell key={subject.id} className="text-center p-4 border-r border-border/10">
                                                        <Input 
                                                            type="number" 
                                                            className="w-28 mx-auto text-center font-black rounded-2xl border-border/50 h-12 bg-background/50 focus:ring-primary/20 focus:border-primary/40 transition-all text-base shadow-inner group-hover:bg-background"
                                                            value={studentMarks[subject.id]?.obtained || 0}
                                                            onChange={(e) => handleMarkChange(student.id, subject.id, e.target.value)}
                                                        />
                                                    </TableCell>
                                                ))}

                                                <TableCell className="text-right py-5 px-8 bg-primary/5 group-hover:bg-primary/10 transition-colors sticky right-0 z-10 backdrop-blur-xl border-l border-border/40">
                                                    <div className="flex items-center justify-end gap-5">
                                                       <div className="flex flex-col items-end">
                                                            <Badge className={`rounded-xl px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] italic shadow-lg mb-1.5 border-none ${
                                                                isPassed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                                            }`}>
                                                                {isPassed ? 'PASSED' : 'FAILED'}
                                                            </Badge>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-lg font-black italic text-foreground tracking-tighter leading-none">{totalObtained}</span>
                                                                <span className="text-[11px] font-bold text-muted-foreground opacity-30">/ {totalPossible}</span>
                                                            </div>
                                                       </div>
                                                       <div className="h-12 w-[1px] bg-border/40 shrink-0" />
                                                       <div className="flex flex-col items-end min-w-[60px]">
                                                            <span className={`text-3xl font-black italic tracking-tighter leading-none group-hover:scale-110 transition-transform ${isPassed ? 'text-primary' : 'text-red-500'}`}>{grade}</span>
                                                            <span className="text-[11px] font-bold text-muted-foreground opacity-50 font-mono italic">{percentage.toFixed(1)}%</span>
                                                       </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-muted/40 border-t border-border/40 flex items-center justify-between shrink-0 backdrop-blur-3xl">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-[1.5rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                            <AlertCircle className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-widest text-orange-600 italic">Pre-Save Audit</span>
                            <span className="text-[10px] font-medium text-muted-foreground opacity-70 italic mt-0.5">Please review the aggregate class standing before finalizing the results.</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-5">
                        <Button 
                            variant="ghost" 
                            className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[11px] hover:bg-red-500/10 hover:text-red-600 transition-all text-muted-foreground border border-transparent hover:border-red-500/20"
                            onClick={() => onOpenChange(false)}
                        >
                            Abort Entry
                        </Button>
                        <Button 
                            className="rounded-2xl px-16 h-16 font-black uppercase tracking-[0.3em] text-sm gap-4 shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all bg-primary transform hover:scale-[1.03] active:scale-95 duration-500 group"
                            onClick={handleSave}
                            disabled={upsertMutation.isPending || isLoading}
                        >
                            {upsertMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                            Save Bulk Results ({students?.length || 0})
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
