'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import NextImage from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { 
    Loader2, 
    ArrowRight, 
    CheckCircle2, 
    ChevronRight, 
    ShieldAlert,
    UserPlus,
    Users,
    AlertCircle,
    GraduationCap,
    Coins
} from 'lucide-react';
import { batchPromoteAllAction } from '../api/student-actions';
import { useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

import { batchPromoteSchema, BatchPromoteData, Student } from '../schemas/student.schema';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useStudents } from '@/features/students/hooks/use-students';
import { getClassRank } from '@/features/classes/utils/class-sorting';
import { useFeeStructures } from '@/features/finance/hooks/use-fee-structures';

interface StateStudent {
    student: Student;
    type: 'PROMOTED' | 'REPEATING';
    roll: string;
    mappingIndex: number;
    isRuleViolator?: boolean;
}


export function BatchPromotionDialog() {
    const [open, setOpen] = useState(false);
    const [pendingOverrides, setPendingOverrides] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: Mapping, 2: Exceptions, 3: Review
    const [successSummary, setSuccessSummary] = useState<string | null>(null);

    const { data: classesData } = useClasses();
    const { data: students = [] } = useStudents({ status: 'ACTIVE' });
    const { data: feeStructures } = useFeeStructures();
    const queryClient = useQueryClient();

    const classes = useMemo(() => {
        if (!classesData || !students) return [];
        const classesWithStudentsIds = new Set(students.map((s) => s.class_id));
        return classesData.filter(c => classesWithStudentsIds.has(c.id));
    }, [classesData, students]);


    const form = useForm<BatchPromoteData>({
        resolver: zodResolver(batchPromoteSchema) as any,
        defaultValues: {
            mappings: [],
            new_academic_year: (new Date().getFullYear() + 1).toString(),
        },
    });

    const prevClassesRef = useRef<string>('');

    // Auto-generate and synchronize mappings
    useEffect(() => {
        if (!open) return; // Only run when dialog is open

        const classesJson = JSON.stringify(classes.map(c => c.id).sort());
        if (classes.length > 0 && classesJson !== prevClassesRef.current) {
            const currentMappings = form.getValues('mappings') || [];
            const sortedClasses = [...classes].sort((a, b) => getClassRank(a.name) - getClassRank(b.name));
            const distinctLevels = Array.from(new Set(sortedClasses.map(c => getClassRank(c.name)))).sort((a, b) => a - b);

            // Create new mappings for classes that aren't mapped yet
            const newMappings = sortedClasses.map((cls) => {
                const existing = currentMappings.find(m => m.source_class_id === cls.id);
                if (existing) return existing;

                const currentRank = getClassRank(cls.name);
                const currentLevelIndex = distinctLevels.indexOf(currentRank);
                const nextLevelRank = distinctLevels[currentLevelIndex + 1];
                const potentialTargets = sortedClasses.filter(c => getClassRank(c.name) === nextLevelRank);
                const sectionMatch = potentialTargets.find(t => t.section === cls.section) || potentialTargets[0];

                return {
                    source_class_id: cls.id as string,
                    destination_class_id: sectionMatch ? sectionMatch.id as string : null,
                    target_monthly_fee: sectionMatch ? feeMap[sectionMatch.id] : undefined,
                    is_graduation: !sectionMatch,
                    excluded_student_ids: [],
                    roll_number_overrides: {},
                };
            });

            form.setValue('mappings', newMappings);
            prevClassesRef.current = classesJson;
        }
    }, [classes, form, open]); // open is used to reset on re-open

    const onSubmit = async (values: BatchPromoteData) => {
        setIsSubmitting(true);
        try {
            const res = await batchPromoteAllAction(values);
            if (!res.success) throw new Error(res.error);

            setSuccessSummary(res.message || "Bulk promotion successful");
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['finance'] });

            setTimeout(() => {
                setOpen(false);
                setSuccessSummary(null);
                setStep(1);
                form.reset();
            }, 5000);
        } catch (error) {
            toast.error((error as Error).message || 'Batch promotion failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setStep(1);
            setSuccessSummary(null);
        }
    };

    const mappings = form.watch('mappings');

    // Helper to match server-side prefix calculation
    const getPredictedRoll = useCallback((student: Student, targetCid: string, isExcluded: boolean, mIdx: number) => {
        const mapping = mappings[mIdx];
        if (!mapping) return student.roll_number;

        const manualOverride = student.id ? mapping.roll_number_overrides?.[student.id] : undefined;
        if (manualOverride) return manualOverride;

        if (isExcluded) return student.roll_number;

        // Promotion logic: match server-side getUpdatedRollNumber
        const targetClass = classesData?.find(c => c.id === targetCid);
        if (!targetClass) return student.roll_number;

        const classNum = targetClass.name.match(/\d+/)?.[0] || targetClass.name;
        const newPrefix = `C${classNum}-${targetClass.section}-`.toUpperCase().replace(/\s+/g, '');

        const oldRoll = student.roll_number as string;
        if (oldRoll.includes('-')) {
            const parts = oldRoll.split('-');
            const suffix = parts[parts.length - 1];
            return newPrefix + suffix;
        }
        return newPrefix + oldRoll;
    }, [mappings, classesData]);

    const feeMap = useMemo(() => {
        if (!feeStructures) return {};
        return Object.fromEntries(feeStructures.map(f => [f.class_id, f.monthly_fee]));
    }, [feeStructures]);

    // Advanced Conflict Discovery Engine: Groups students by their destination for the NEW session
    const conflictClusters = useMemo(() => {
        if (step !== 3 || !classesData) return [];

        const finalState: Record<string, StateStudent[]> = {};
        const handledIds = new Set<string>();

        // 1. Group students from source classes being moved
        mappings.forEach((m, mIdx) => {
            const classStudents = students.filter(s => s.class_id === m.source_class_id);
            classStudents.forEach(s => {
                if (!s.id) return;
                handledIds.add(s.id);
                const isExcluded = m.excluded_student_ids.includes(s.id);
                const targetId = isExcluded ? m.source_class_id : m.destination_class_id;

                if (targetId) {
                    const roll = getPredictedRoll(s, targetId as string, isExcluded, mIdx);
                    const oldSuffix = parseInt(s.roll_number.split('-').pop() || '0');
                    const newSuffix = parseInt(roll.split('-').pop() || '0');
                    
                    if (!finalState[targetId]) finalState[targetId] = [];
                    finalState[targetId].push({
                        student: s,
                        type: isExcluded ? 'REPEATING' : 'PROMOTED',
                        roll,
                        mappingIndex: mIdx,
                        isRuleViolator: isExcluded && (newSuffix <= oldSuffix)
                    });
                }
            });
        });

        // 2. Add remaining stationary students to the simulation
        students.forEach(s => {
            if (s.id && !handledIds.has(s.id) && s.class_id) {
                if (!finalState[s.class_id]) finalState[s.class_id] = [];
                finalState[s.class_id].push({
                    student: s,
                    type: 'REPEATING',
                    roll: s.roll_number,
                    mappingIndex: -1,
                    isRuleViolator: false
                });
            }
        });

        const conflictGroups = [];
        for (const [classId, pool] of Object.entries(finalState)) {
            const rollGroups: Record<string, StateStudent[]> = {};
            pool.forEach(item => {
                if (!rollGroups[item.roll]) rollGroups[item.roll] = [];
                rollGroups[item.roll].push(item);
            });

            const classConflicts = Object.entries(rollGroups)
                .filter(([, group]) => group.length > 1 || group.some(s => s.isRuleViolator))
                .map(([roll, group]) => ({
                    roll,
                    students: group.filter(i => i.mappingIndex !== -1 || group.length > 1) // Keep stationary if part of a physical collision
                }));

            // Only show classes that have at least one manageable student in a conflict or rule violation
            const hasVisibleConflicts = classConflicts.some(c => c.students.some(s => s.mappingIndex !== -1));

            if (hasVisibleConflicts) {
                let maxSuffix = 0;
                pool.forEach(p => {
                    const suffixValue = parseInt(p.roll.split('-').pop() || '0');
                    if (!isNaN(suffixValue) && suffixValue > maxSuffix) maxSuffix = suffixValue;
                });

                conflictGroups.push({
                    classId,
                    className: classesData?.find(c => c.id === classId)?.name || 'Class',
                    section: classesData?.find(c => c.id === classId)?.section || '?',
                    Conflicts: classConflicts,
                    suggestedNext: maxSuffix + 1
                });
            }
        }
        return conflictGroups;
    }, [step, mappings, students, classesData, getPredictedRoll]);

    const hasValidationErrors = useMemo(() => {
        if (step !== 3) return false;
        
        let hasError = false;
        mappings.forEach((m, mIdx) => {
            const classStudents = students.filter(s => s.class_id === m.source_class_id);
            classStudents.forEach(s => {
                const isExcluded = m.excluded_student_ids.includes(s.id);
                if (isExcluded) {
                    const overrides = m.roll_number_overrides || {};
                    const currentRoll = overrides[s.id] || getPredictedRoll(s, m.source_class_id, true, mIdx);
                    
                    const oldSuffix = parseInt(s.roll_number.split('-').pop() || '0');
                    const newSuffix = parseInt(currentRoll.split('-').pop() || '0');
                    
                    if (newSuffix <= oldSuffix) {
                        hasError = true;
                    }
                }
            });
        });

        // Also check if any manageable conflicts remain
        if (conflictClusters.length > 0) hasError = true;

        return hasError;
    }, [step, mappings, students, conflictClusters, getPredictedRoll]);

    const hasConflicts = conflictClusters.length > 0 || hasValidationErrors;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    School-Wide Promotion
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-8xl max-h-[90vh] overflow-hidden flex flex-col p-0 shadow-2xl border-none">
                {successSummary ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight uppercase">Academic Year Transferred!</h3>
                            <p className="text-muted-foreground px-12 max-w-md mx-auto font-medium">{successSummary}</p>
                        </div>
                        <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full px-10">Return to Dashboard</Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] px-3">STEP {step} OF 3</Badge>
                                {hasConflicts && step === 3 && <Badge variant="destructive" className="animate-pulse px-3 font-black text-[10px]">CONFLICT WARNING</Badge>}
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight uppercase">Process Batch Promotion</DialogTitle>
                            <DialogDescription className="font-medium">
                                {step === 1 && "Phase 1: Configure Grade-to-Grade transitions and year settings."}
                                {step === 2 && "Phase 2: Review student lists and handle failures/repeats."}
                                {step === 3 && "Phase 3: Resolve conflicts and commit session changes."}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<BatchPromoteData>)} className="flex flex-col flex-1 overflow-hidden min-h-0">
                                <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar">
                                    {step === 1 && (
                                        <div className="space-y-8 pb-4">
                                            <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 shadow-inner">
                                                <FormField
                                                    control={form.control}
                                                    name="new_academic_year"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Academic Session</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. 2026-27" className="max-w-[220px] h-12 text-xl font-black border-2 focus-visible:ring-primary/20 rounded-xl" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Level-to-Level Mappings</h4>
                                                <div className="grid gap-3">
                                                    {mappings.map((mapping, index) => {
                                                        const sourceClass = classes.find(c => c.id === mapping.source_class_id);
                                                        return (
                                                            <div key={mapping.source_class_id} className="group flex flex-col sm:flex-row sm:items-center gap-4 bg-card border rounded-2xl p-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0">{sourceClass?.name?.charAt(0)}</div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black text-sm">{sourceClass?.name}</span>
                                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SECTION {sourceClass?.section}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <ArrowRight className="h-4 w-4 text-muted-foreground/20 hidden sm:block" />
                                                                <div className="flex-[1.5]">
                                                                    <Select
                                                                        value={mapping.destination_class_id || (mapping.is_graduation ? 'graduate' : '')}
                                                                        onValueChange={(val) => {
                                                                            const newMappings = [...mappings];
                                                                            if (val === 'graduate') {
                                                                                newMappings[index].destination_class_id = null;
                                                                                newMappings[index].is_graduation = true;
                                                                                newMappings[index].target_monthly_fee = undefined;
                                                                            } else {
                                                                                newMappings[index].destination_class_id = val;
                                                                                newMappings[index].is_graduation = false;
                                                                                // Auto-fill fee from map if available
                                                                                newMappings[index].target_monthly_fee = feeMap[val];
                                                                            }
                                                                            form.setValue('mappings', newMappings);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-11 border-2 font-black rounded-xl"><SelectValue placeholder="Target Class" /></SelectTrigger>
                                                                        <SelectContent className="rounded-xl">
                                                                            <SelectItem value="graduate" className="text-amber-600 font-black">🎓 GRADUATION</SelectItem>
                                                                            <Separator className="my-1" />
                                                                            {classesData?.map(c => (
                                                                                <SelectItem key={c.id} value={c.id as string} className="font-bold">{c.name} - {c.section}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {!mapping.is_graduation && (
                                                                    <div className="flex-[0.7] relative group/fee">
                                                                        <div className="absolute -top-6 left-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest italic opacity-0 group-hover/fee:opacity-100 transition-opacity">New Session Fee</div>
                                                                        <div className="relative">
                                                                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                                            <Input
                                                                                type="number"
                                                                                placeholder="Fee"
                                                                                value={mapping.target_monthly_fee || ''}
                                                                                className="h-11 pl-9 border-2 font-black rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all"
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                                                    const newMappings = [...mappings];
                                                                                    newMappings[index].target_monthly_fee = val;
                                                                                    form.setValue('mappings', newMappings);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-6">
                                            <div className="bg-sky-500/5 border border-sky-500/20 p-5 rounded-2xl flex gap-4 text-sky-900 dark:text-sky-100 text-sm font-bold shadow-sm">
                                                <Users className="h-6 w-6 text-sky-500 shrink-0" />
                                                <p className="leading-relaxed">Student Exceptions: Uncheck students who failed. They will stay in their current grade level for the next session.</p>
                                            </div>
                                            <div className="space-y-6">
                                                {mappings.map((m, mIndex) => {
                                                    const sc = classes.find(c => c.id === m.source_class_id);
                                                    const classStudents = students.filter(s => s.class_id === m.source_class_id);
                                                    return (
                                                        <div key={m.source_class_id} className="border-2 rounded-2xl overflow-hidden shadow-sm hover:border-primary/20 transition-colors">
                                                            <div className="bg-muted/50 p-4 flex justify-between items-center sm:flex-row flex-col gap-3 border-b">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-black text-xs text-primary border">{sc?.section}</div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-sm uppercase tracking-tight">{sc?.name}</span>
                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{classStudents.length} ENROLLED</span>
                                                                    </div>
                                                                </div>
                                                                <Badge variant="outline" className="bg-white/80 font-black text-[9px] uppercase tracking-widest px-3 h-6">{m.is_graduation ? "GRADUATING" : `TARGET: ${classes.find(c => c.id === m.destination_class_id)?.name || '?'}`}</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50">
                                                                {classStudents.map(s => (
                                                                    <div key={s.id} className="flex items-center gap-4 p-4 bg-card transition-colors hover:bg-muted/10 group">
                                                                        <Checkbox
                                                                            id={`promote-${s.id}`}
                                                                            className="h-5 w-5 rounded-md border-2"
                                                                            checked={!m.excluded_student_ids.includes(s.id ?? '')}
                                                                            onCheckedChange={(checked) => {
                                                                                const newMappings = [...mappings];
                                                                                const currentExcs = newMappings[mIndex].excluded_student_ids || [];
                                                                                if (!checked) {
                                                                                    newMappings[mIndex].excluded_student_ids = [...currentExcs, s.id ?? ''];
                                                                                } else {
                                                                                    newMappings[mIndex].excluded_student_ids = currentExcs.filter(id => id !== s.id);
                                                                                }
                                                                                form.setValue('mappings', newMappings);
                                                                            }}
                                                                        />
                                                                        <label htmlFor={`promote-${s.id}`} className="flex-1 min-w-0 cursor-pointer">
                                                                            <div className="font-black text-xs truncate uppercase tracking-tight group-hover:text-primary transition-colors">{s.full_name}</div>
                                                                            <div className="text-[10px] font-bold text-muted-foreground">ROLL: {s.roll_number}</div>
                                                                        </label>
                                                                        {!m.excluded_student_ids.includes(s.id) ? (
                                                                            <UserPlus className="h-4 w-4 text-emerald-500/30 group-hover:text-emerald-500 transition-colors" />
                                                                        ) : (
                                                                            <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-black text-[8px] h-5 uppercase">FAIL/REPEAT</Badge>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="space-y-6">
                                            {hasConflicts ? (
                                                <div className="space-y-4">
                                                    <div className="bg-destructive/5 border-2 border-destructive/20 p-6 rounded-2xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rotate-45 translate-x-16 -translate-y-16" />
                                                        <div className="flex items-center gap-3 text-destructive mb-4 relative z-10">
                                                            <ShieldAlert className="h-8 w-8" />
                                                            <h4 className="font-black text-xl tracking-tight uppercase">Data Conflict Alert</h4>
                                                        </div>
                                                        <p className="text-sm font-bold leading-relaxed text-destructive/80 mb-0 max-w-xl italic relative z-10">
                                                            Roll number overlaps detected in the new session. Students staying back (repeating) and students moving in are sharing numbers. resolve these below.
                                                        </p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {conflictClusters.map((cluster, cIdx) => (
                                                            <div 
                                                                key={cIdx} 
                                                                id={`conflict-class-${cluster.classId}`}
                                                                className="border-2 rounded-2xl overflow-hidden bg-card shadow-sm border-destructive/10 scroll-mt-20"
                                                            >
                                                                <div className="bg-muted/40 p-4 border-b flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black text-xs shadow-sm">{cluster.section}</div>
                                                                        <div>
                                                                            <span className="font-black text-xs uppercase tracking-tight">{cluster.className}</span>
                                                                            <span className="text-[9px] font-black text-muted-foreground block uppercase">CONFLICTING SQUAD</span>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white border-destructive/20 text-destructive">
                                                                        {cluster.Conflicts.length} OVERLAPS
                                                                    </Badge>
                                                                </div>

                                                                <div className="divide-y divide-destructive/5">
                                                                    {cluster.Conflicts.map((conf, confIdx) => (
                                                                        <div key={confIdx} className="p-6 bg-destructive/5 space-y-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge className={`${conf.students.length > 1 ? 'bg-destructive' : 'bg-amber-600'} text-white border-none font-black text-[9px] h-5 px-3 uppercase tracking-widest`}>
                                                                                {conf.students.length > 1 ? `CONFLICT ON ROLL #${conf.roll}` : `ACTION REQUIRED: ROLL #${conf.roll}`}
                                                                                </Badge>
                                                                                <div className="h-px flex-1 bg-destructive/10" />
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {conf.students.map((item, iIdx) => {
                                                                                    const isPromoted = item.type === 'PROMOTED';
                                                                                    const isExcluded = !isPromoted;
                                                                                    const sourceClassName = item.mappingIndex !== -1 ? (classesData?.find(c => c.id === mappings[item.mappingIndex].source_class_id)?.name) : 'Stationary';
                                                                                    const studentId = item.student.id;
                                                                                    const overrides = item.mappingIndex !== -1 ? (mappings[item.mappingIndex].roll_number_overrides || {}) : {};
                                                                                    
                                                                                    const pendingVal = studentId ? pendingOverrides[studentId] : undefined;
                                                                                    const currentVal = pendingVal || (studentId ? overrides[studentId as string] : undefined) || conf.roll;
                                                                                    const isModified = !!(studentId && overrides[studentId as string]);
                                                                                    
                                                                                    const newSuffix = parseInt(currentVal.split('-').pop() || '0');
                                                                                    const isInvalid = !isPromoted && (newSuffix < cluster.suggestedNext);

                                                                                    return (
                                                                                        <div key={iIdx} className={`bg-white dark:bg-black/40 rounded-2xl border-2 transition-all p-4 shadow-sm relative overflow-hidden flex flex-col gap-4 ${isModified ? 'border-emerald-500/30' : 'border-white dark:border-white/5'}`}>
                                                                                            <div className="flex items-start justify-between">
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <Dialog>
                                                                                                        <DialogTrigger asChild>
                                                                                                            <div className="cursor-zoom-in group/avatar relative">
                                                                                                                <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm transition-transform group-hover/avatar:scale-105">
                                                                                                                    <AvatarImage src={item.student.photo_url || ''} />
                                                                                                                    <AvatarFallback className={`rounded-xl font-black ${isPromoted ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'}`}>
                                                                                                                        {item.student.full_name?.charAt(0)}
                                                                                                                    </AvatarFallback>
                                                                                                                </Avatar>
                                                                                                            </div>
                                                                                                        </DialogTrigger>
                                                                                                        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-sm">
                                                                                                            <div className="relative group">
                                                                                                                <NextImage
                                                                                                                    src={item.student.photo_url || ''}
                                                                                                                    alt={item.student.full_name || 'Student'}
                                                                                                                    width={400}
                                                                                                                    height={400}
                                                                                                                    className="w-full h-auto rounded-3xl shadow-2xl border-4 border-white object-cover"
                                                                                                                />
                                                                                                                <div className="absolute bottom-6 left-6 right-6 p-5 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
                                                                                                                    <p className="font-black text-sm uppercase tracking-wider text-white">{item.student.full_name}</p>
                                                                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.student.roll_number}</p>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </DialogContent>
                                                                                                    </Dialog>
                                                                                                    <div className="flex flex-col">
                                                                                                        <span className="font-black text-xs uppercase truncate max-w-[120px] text-zinc-900 dark:text-zinc-100">{item.student.full_name}</span>
                                                                                                        <div className="flex flex-col gap-0.5">
                                                                                                            <Badge className={`h-4 text-[7px] font-black uppercase px-2 w-fit border-none ${isPromoted ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                                                                                                {isPromoted ? 'PROMOTED' : 'FAILED / REPEATING'}
                                                                                                            </Badge>
                                                                                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tight">
                                                                                                                {isPromoted ? `From ${sourceClassName}` : `Stays in ${cluster.className}`}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="text-right">
                                                                                                    <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1 tracking-tighter">Current Roll</span>
                                                                                                    <span className="text-xs font-black text-destructive tracking-widest">{conf.roll}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="pt-2 border-t mt-auto">
                                                                                                <div className="relative group/input">
                                                                                                    <Input
                                                                                                        value={currentVal}
                                                                                                        placeholder="New Roll Number"
                                                                                                        className={`bg-black/40 border-primary/20 h-10 text-xs font-black tracking-widest uppercase focus:ring-1 focus:ring-emerald-500 transition-all ${isInvalid ? 'border-destructive ring-1 ring-destructive animate-pulse' : isModified ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : ''}`}
                                                                                                        onChange={(e) => {
                                                                                                            const val = e.target.value.trim().toUpperCase();
                                                                                                            if (studentId) {
                                                                                                                setPendingOverrides(prev => ({ ...prev, [studentId]: val }));
                                                                                                            }
                                                                                                        }}
                                                                                                        disabled={!isExcluded || item.mappingIndex === -1}
                                                                                                    />
                                                                                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                                                                                        {isInvalid ? (
                                                                                                            <AlertCircle className="h-4 w-4 text-destructive animate-bounce" />
                                                                                                        ) : isModified ? (
                                                                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                                                        ) : null}
                                                                                                    </div>
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        size="icon"
                                                                                                        variant="secondary"
                                                                                                        title={isInvalid ? "Enter value >= suggested suffix" : "Save Changes"}
                                                                                                        className={`absolute right-0 top-0 h-10 w-10 border-l border-white/10 rounded-l-none transition-colors ${isInvalid ? 'opacity-50 cursor-not-allowed' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                                                                                        disabled={isPromoted || isInvalid || item.mappingIndex === -1}
                                                                                                        onClick={() => {
                                                                                                            if (!isInvalid && studentId && item.mappingIndex !== -1) {
                                                                                                                const newMappings = [...mappings];
                                                                                                                const studentOverrides = { ...newMappings[item.mappingIndex].roll_number_overrides };
                                                                                                                studentOverrides[studentId] = currentVal;
                                                                                                                newMappings[item.mappingIndex].roll_number_overrides = studentOverrides;
                                                                                                                form.setValue('mappings', newMappings, { shouldValidate: true, shouldDirty: true });
                                                                                toast.success(`Roll Number updated for ${item.student.full_name}`);
                                                                                                            }
                                                                                                        }}
                                                                                                    >
                                                                                                        {isInvalid ? <ArrowRight className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                                                    </Button>
                                                                                                </div>
                                                                                                <div className="mt-1.5 space-y-1">
                                                                                                    {isInvalid && (
                                                                                                        <p className="text-[10px] text-destructive font-black uppercase tracking-tighter italic leading-none">
                                                                                                            Must be at least suffix {cluster.suggestedNext}
                                                                                                        </p>
                                                                                                    )}
                                                                                                    {isExcluded && !isModified && (
                                                                                                        <p className="text-[9px] text-emerald-600/60 font-black uppercase tracking-widest italic animate-pulse">Suggestion: {cluster.Conflicts[0].roll.split('-').slice(0,-1).join('-')}-{cluster.suggestedNext}</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-emerald-500/5 border-2 border-emerald-500/20 p-6 rounded-2xl flex gap-5 items-center">
                                                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20 shrink-0 shadow-sm">
                                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-emerald-900 dark:text-emerald-100 text-lg tracking-tight uppercase italic">Pre-Flight Check Passed</p>
                                                        <p className="text-sm text-emerald-700/80 font-bold">Validated {mappings.length} classes. All roll numbers are unique for the new session.</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="border-2 rounded-2xl overflow-hidden shadow-xl">
                                                <div className="bg-muted/50 p-3 px-6 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b grid grid-cols-12 bg-white dark:bg-white/5">
                                                    <span className="col-span-4">SOURCE CLASS / STATUS</span>
                                                    <span className="col-span-3 text-center">FEE TRANSITION</span>
                                                    <span className="col-span-5 text-right">ACTION & TARGET</span>
                                                </div>
                                                <div className="divide-y max-h-[350px] overflow-y-auto custom-scrollbar bg-card">
                                                    {mappings.map((m) => {
                                                        const targetId = m.is_graduation ? null : m.destination_class_id;
                                                        const hasClassConflict = conflictClusters.some(c => c.classId === m.destination_class_id || c.classId === m.source_class_id);
                                                        const sc = classes.find(c => c.id === m.source_class_id);
                                                        const dc = classes.find(c => c.id === m.destination_class_id);
                                                        
                                                        const sourceFee = sc ? feeMap[sc.id] : undefined;
                                                        const targetFee = targetId ? feeMap[targetId] : (m.is_graduation ? null : undefined);
                                                        
                                                        const promotedCount = students.filter(s => s.class_id === m.source_class_id && !m.excluded_student_ids.includes(s.id || '')).length;
                                                        const repeatCount = m.excluded_student_ids.length;
                                                        return (
                                                            <div 
                                                                key={m.source_class_id} 
                                                                className={`grid grid-cols-12 items-center p-4 px-6 hover:bg-muted/10 transition-colors group ${hasClassConflict ? 'cursor-pointer' : ''}`}
                                                                onClick={() => {
                                                                    if (hasClassConflict && targetId) {
                                                                        document.getElementById(`conflict-class-${targetId}`)?.scrollIntoView({ behavior: 'smooth' });
                                                                    }
                                                                }}
                                                            >
                                                                <div className="col-span-4 flex items-center gap-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-sm tracking-tighter uppercase group-hover:text-primary transition-colors">{sc?.name}</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Badge className="bg-primary/5 text-primary text-[8px] font-black border-none h-4 px-2 uppercase">{sc?.section}</Badge>
                                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">SESSION {students.find(s => s.class_id === m.source_class_id)?.academic_year || 'CURRENT'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="col-span-3 flex flex-col items-center">
                                                                    {m.is_graduation ? (
                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase italic opacity-40">N/A</span>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-bold text-muted-foreground/50 line-through">Rs. {sourceFee?.toLocaleString() || '-'}</span>
                                                                            <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                                                                            {m.target_monthly_fee !== undefined ? (
                                                                                <span className="text-[11px] font-black text-emerald-600">Rs. {m.target_monthly_fee.toLocaleString()}</span>
                                                                            ) : (
                                                                                <Badge variant="destructive" className="h-4 text-[7px] font-black uppercase px-2 animate-pulse">MISSING CONFIG</Badge>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="col-span-5 flex items-center justify-end gap-6">
                                                                    <div className="text-right flex flex-col items-end">
                                                                        <span className="text-[10px] font-black text-emerald-600 block leading-none">{promotedCount} {m.is_graduation ? "GRADUATING" : "PROMOTING"}</span>
                                                                        <span className="text-[10px] font-black text-amber-600 block leading-none">{repeatCount} REPEATING</span>
                                                                    </div>
                                                                    <ArrowRight className="h-4 w-4 text-muted-foreground/20" />
                                                                    <div className="w-[120px] text-right">
                                                                        {m.is_graduation ? (
                                                                            <Badge className="bg-amber-100 text-amber-800 border-none font-black italic text-[9px] px-3 uppercase tracking-tighter">ALUMNI STATUS</Badge>
                                                                        ) : (
                                                                            <div className="flex flex-col items-end">
                                                                                <span className="font-black text-primary text-sm tracking-tighter uppercase">{dc?.name}</span>
                                                                                <span className="text-[9px] text-muted-foreground font-black uppercase">SECTION {dc?.section}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t flex justify-end items-center gap-4 bg-muted/20">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            if ((step as number) === 1) handleOpenChange(false);
                                            else setStep(step - 1);
                                        }}
                                        disabled={isSubmitting}
                                        className="h-12 px-8 font-black uppercase tracking-tighter text-muted-foreground hover:text-black hover:bg-white"
                                    >
                                        {step === 1 ? "Cancel Operation" : "Back to Previous Step"}
                                    </Button>

                                    {step < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={() => setStep(step + 1)}
                                            className="h-12 px-10 gap-2 font-black shadow-xl shadow-primary/20 rounded-xl"
                                            disabled={mappings.length === 0}
                                        >
                                            {step === 1 ? "Review Student List" : "Final Conflict Check"}
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || hasConflicts}
                                            className={`h-12 min-w-[240px] font-black shadow-xl gap-2 rounded-xl uppercase tracking-tighter transition-all ${
                                                hasConflicts 
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-2 border-dashed border-slate-300' 
                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30'
                                             }`}
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="h-5 w-5 animate-spin" /> Committing Batch...</>
                                            ) : (
                                                <><CheckCircle2 className="h-5 w-5" /> Execute Official Transfer</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}



