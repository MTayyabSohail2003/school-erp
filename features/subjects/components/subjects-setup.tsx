'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Trash2, Loader2, Layers, CheckCircle2, X, AlertCircle, Printer } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useSubjectsMaster, useCreateMasterSubject, useDeleteMasterSubject } from '../hooks/use-subjects-master';
import { useBulkCreateMasterSubjects } from '../hooks/use-bulk-create-master-subjects';
import { useClassSubjects } from '../hooks/use-class-subjects';
import { subjectsAssignmentApi } from '../api/subjects-assignment.api';
import { useAssignSubjects } from '../hooks/use-assign-subjects';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useAllClassSubjects } from '../hooks/use-all-class-subjects';
import { CurriculumReport } from './curriculum-report';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const subjectSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().optional(),
    targetClassId: z.string().optional(),
});

const bulkSchema = z.object({
    subjects: z.array(z.object({
        name: z.string().min(1, 'Name required'),
        code: z.string().optional(),
    })).min(1, 'At least one subject is required'),
    targetClassId: z.string().optional(),
});

export function SubjectsSetup() {
    const queryClient = useQueryClient();
    const { data: classes } = useClasses();
    const { data: masterPool, isLoading: isMasterLoading } = useSubjectsMaster();
    const createMaster = useCreateMasterSubject();
    const deleteMaster = useDeleteMasterSubject();
    const bulkCreateMaster = useBulkCreateMasterSubjects();

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const { data: classSubjects, isLoading: isClassLoading } = useClassSubjects(selectedClassId);
    const { data: allAssignments } = useAllClassSubjects();
    const assignMutation = useAssignSubjects();

    const [masterOpen, setMasterOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);

    // Assignment state
    const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
    
    // Deletion states
    const [deleteItem, setDeleteItem] = useState<{ id: string; name: string; type: 'master' | 'assignment' } | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof subjectSchema>>({
        resolver: zodResolver(subjectSchema),
        defaultValues: { name: '', code: '', targetClassId: '' },
    });

    const bulkForm = useForm<z.infer<typeof bulkSchema>>({
        resolver: zodResolver(bulkSchema),
        defaultValues: { 
            subjects: [{ name: '', code: '' }],
            targetClassId: ''
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: bulkForm.control,
        name: "subjects"
    });

    // Reset bulk form with one empty row when dialog opens
    useEffect(() => {
        if (bulkOpen) {
            bulkForm.reset({ subjects: [{ name: '', code: '' }], targetClassId: '' });
        }
    }, [bulkOpen, bulkForm]);

    const onAddMaster = (values: z.infer<typeof subjectSchema>) => {
        createMaster.mutate(
            { 
                name: values.name.trim().toUpperCase(), 
                code: values.code?.trim().toUpperCase() || null 
            },
            {
                onSuccess: (newMaster) => {
                    if (values.targetClassId) {
                        subjectsAssignmentApi.bulkAssignSubjects(
                            values.targetClassId,
                            [newMaster.id],
                            [{ id: newMaster.id, name: newMaster.name, code: newMaster.code }]
                        ).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['subjects', 'class', values.targetClassId] });
                            queryClient.invalidateQueries({ queryKey: ['subjects', 'all-assignments'] });
                            toast.success(`Success: ${newMaster.name} added and assigned to class.`);
                        }).catch(e => toast.error(`Master created, but assignment failed: ${e.message}`));
                    } else {
                        toast.success('Added to collection.');
                    }
                    form.reset();
                    setMasterOpen(false);
                },
                onError: (err: Error) => toast.error(err.message)
            }
        );
    };

    const onBulkAdd = (values: z.infer<typeof bulkSchema>) => {
        const subjects = values.subjects
            .filter(s => s.name.trim().length > 0)
            .map(s => ({
                name: s.name.trim().toUpperCase(),
                code: s.code?.trim().toUpperCase() || null
            }));

        if (subjects.length === 0) return;

        bulkCreateMaster.mutate(subjects, {
            onSuccess: (newMasters) => {
                if (values.targetClassId) {
                    const masterIds = newMasters.map(m => m.id);
                    subjectsAssignmentApi.bulkAssignSubjects(
                        values.targetClassId,
                        masterIds,
                        newMasters
                    ).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['subjects', 'class', values.targetClassId] });
                        queryClient.invalidateQueries({ queryKey: ['subjects', 'all-assignments'] });
                        toast.success(`Success: ${newMasters.length} subjects added and assigned.`);
                    }).catch(e => toast.error(`Master created, but assignment failed: ${e.message}`));
                } else {
                    toast.success(`Added ${newMasters.length} subjects to collection.`);
                }
                bulkForm.reset();
                setBulkOpen(false);
            },
            onError: (err: Error) => toast.error(err.message)
        });
    };

    const onAssign = () => {
        if (!selectedClassId || selectedMasterIds.length === 0) return;

        assignMutation.mutate(
            { 
                classId: selectedClassId, 
                masterIds: selectedMasterIds, 
                masterSubjects: masterPool || [] 
            },
            {
                onSuccess: () => {
                    toast.success('Assignment Successful');
                    setSelectedMasterIds([]);
                    setAssignOpen(false);
                },
                onError: (err: Error) => toast.error(err.message)
            }
        );
    };

    const handleDeleteMaster = (id: string, name: string) => {
        setDeleteItem({ id, name, type: 'master' });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteItem) return;

        if (deleteItem.type === 'master') {
            deleteMaster.mutate(deleteItem.id, {
                onSuccess: () => {
                    toast.success('Subject removed from pool.');
                    setIsDeleteDialogOpen(false);
                    setDeleteItem(null);
                },
                onError: (err: Error) => toast.error(err.message)
            });
        } else {
            // Remove assignment
            subjectsAssignmentApi.deleteAssignment(deleteItem.id)
                .then(() => {
                    toast.success('Assignment removed.');
                    setIsDeleteDialogOpen(false);
                    setDeleteItem(null);
                    // Invalidate specifically the class subjects query
                    queryClient.invalidateQueries({ queryKey: ['subjects', 'class', selectedClassId] });
                    queryClient.invalidateQueries({ queryKey: ['subjects', 'all-assignments'] });
                })
                .catch((err: Error) => toast.error(err.message));
        }
    };

    return (
        <div className="space-y-8">
            {/* ── Card 1: Master Collection ── */}
            <Card className="border-primary/10 shadow-sm bg-background/50 dark:bg-muted/5 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800" />
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-emerald-500" />
                                Master Subject Collection
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1 font-medium">Your central library of all educational books/subjects.</p>
                        </div>

                        <div className="flex gap-2">
                            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="font-bold border-dashed border-emerald-500/30 hover:bg-emerald-500/5">
                                        <Layers className="h-4 w-4 mr-2" /> Bulk Add
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Bulk Add Subjects</DialogTitle>
                                        <DialogDescription>Add multiple subjects to your collection at once.</DialogDescription>
                                    </DialogHeader>
                                    <Form {...bulkForm}>
                                        <form onSubmit={bulkForm.handleSubmit(onBulkAdd)} className="space-y-4 pt-4">
                                            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-muted">
                                                {fields.map((field, index) => (
                                                    <div key={field.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                                            <FormField
                                                                control={bulkForm.control}
                                                                name={`subjects.${index}.name`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input placeholder="Subject Name" className="h-9 text-xs font-bold" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage className="text-[10px]" />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={bulkForm.control}
                                                                name={`subjects.${index}.code`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input placeholder="Code" className="h-9 text-xs font-bold uppercase" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage className="text-[10px]" />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => fields.length > 1 && remove(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-col gap-3 pt-2">
                                                <div className="space-y-1.5 px-0.5">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Pre-Assign to Class (Optional)</label>
                                                    <select 
                                                        className="w-full h-10 bg-background border-2 border-emerald-500/10 rounded-xl px-4 font-bold text-xs outline-none focus:border-emerald-500/40 transition-all appearance-none cursor-pointer dark:bg-muted/10 dark:text-foreground"
                                                        {...bulkForm.register('targetClassId')}
                                                    >
                                                        <option value="" className="dark:bg-background">Do not assign...</option>
                                                        {classes?.map(c => <option key={c.id} value={c.id} className="dark:bg-background">{c.name} - {c.section}</option>)}
                                                    </select>
                                                </div>

                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="w-full font-bold border-dashed h-10"
                                                    onClick={() => append({ name: '', code: '' })}
                                                >
                                                    <Plus className="h-3 w-3 mr-2 text-emerald-500" /> Add More Row
                                                </Button>

                                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-11" disabled={bulkCreateMaster.isPending}>
                                                    {bulkCreateMaster.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Finalize & Create Collection
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={masterOpen} onOpenChange={setMasterOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20">
                                        <Plus className="h-4 w-4 mr-2" /> Add Single
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Create Master Subject</DialogTitle></DialogHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onAddMaster)} className="space-y-4 pt-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs">Subject Name</FormLabel>
                                                        <FormControl><Input placeholder="e.g. Computer Science" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="code"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs">Internal Code</FormLabel>
                                                        <FormControl><Input placeholder="CS-101" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="targetClassId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs uppercase text-muted-foreground tracking-widest pl-1">Pre-Assign to Class (Optional)</FormLabel>
                                                        <select 
                                                            className="flex h-11 w-full rounded-xl border-2 border-emerald-500/10 bg-background px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500/40 transition-all appearance-none cursor-pointer dark:bg-muted/10 dark:text-foreground"
                                                            {...field}
                                                        >
                                                            <option value="" className="dark:bg-background">Do not assign...</option>
                                                            {classes?.map(c => <option key={c.id} value={c.id} className="dark:bg-background">{c.name} - {c.section}</option>)}
                                                        </select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full bg-emerald-600 font-bold" disabled={createMaster.isPending}>
                                                {createMaster.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add to Pool
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {isMasterLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-xl" />)}
                        </div>
                    ) : !masterPool?.length ? (
                        <div className="p-12 text-center border-2 border-dashed border-muted rounded-2xl bg-muted/5 text-muted-foreground font-medium">
                            Your collection is empty. Add your first subject to get started.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {masterPool.map(subject => {
                                const assignedClassesCount = allAssignments?.filter(a => a.master_id === subject.id || a.name === subject.name).length || 0;
                                return (
                                    <div key={subject.id} className="relative group p-4 rounded-xl border bg-background hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDeleteMaster(subject.id, subject.name)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-sm pr-4 truncate">{subject.name.toUpperCase()}</h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{subject.code?.toUpperCase() || 'No Code'}</p>
                                            {assignedClassesCount > 0 && (
                                                <Badge variant="secondary" className="h-4 px-1 text-[8px] font-black bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                    {assignedClassesCount} Classes
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Card 2: Pro Assignment Builder ── */}
            <Card className="border-primary/10 shadow-lg bg-background/50 dark:bg-muted/5 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900" />
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Selector Area */}
                        <div className="w-full lg:w-1/3 space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-foreground">
                                        <Layers className="h-5 w-5 text-blue-600" />
                                        Class Assignments
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 font-medium">Dynamically link books to specific classes.</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="font-bold border-blue-500/20 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400 shrink-0 h-9"
                                    onClick={() => window.print()}
                                    disabled={!allAssignments?.length}
                                >
                                    <Printer className="h-4 w-4 mr-1 sm:mr-2" /> 
                                    <span className="hidden sm:inline">Print Report</span>
                                    <span className="sm:hidden">Print</span>
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground block">1. Choose Target Class</label>
                                    <select 
                                        className="w-full h-11 bg-background border-2 border-blue-500/10 rounded-xl px-4 font-bold text-sm outline-none focus:border-blue-500/40 transition-all dark:bg-muted/10 dark:text-foreground cursor-pointer appearance-none"
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                    >
                                        <option value="" className="dark:bg-background">Select a class...</option>
                                        {classes?.map(c => <option key={c.id} value={c.id} className="dark:bg-background">{c.name} - {c.section}</option>)}
                                    </select>
                                </div>

                                <Dialog open={assignOpen} onOpenChange={(o) => {
                                    setAssignOpen(o);
                                    if (!o) setSelectedMasterIds([]);
                                }}>
                                    <DialogTrigger asChild>
                                        <Button 
                                            disabled={!selectedClassId} 
                                            className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Pick from Collection
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle>Assign Subjects to {classes?.find(c => c.id === selectedClassId)?.name}</DialogTitle>
                                            <DialogDescription>Select the subjects you want to teach in this class.</DialogDescription>
                                        </DialogHeader>
                                        
                                        <div className="flex-1 overflow-y-auto py-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                {masterPool?.map(m => {
                                                    const isLocalAssigned = classSubjects?.some(cs => cs.master_id === m.id || cs.name === m.name);
                                                    const others = allAssignments?.filter(a => (a.master_id === m.id || a.name === m.name) && a.class_id !== selectedClassId);
                                                    const isGloballyAssigned = !!others?.length;
                                                    const isUnavailable = isLocalAssigned || isGloballyAssigned;

                                                    return (
                                                        <div 
                                                            key={m.id} 
                                                            onClick={() => !isUnavailable && setSelectedMasterIds(prev => 
                                                                prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                                                            )}
                                                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                                                                isUnavailable ? 'opacity-50 cursor-not-allowed bg-muted border-transparent shadow-inner' :
                                                                selectedMasterIds.includes(m.id) ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                                            }`}
                                                        >
                                                            <Checkbox checked={selectedMasterIds.includes(m.id) || isLocalAssigned || isGloballyAssigned} disabled={isUnavailable} />
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-xs truncate">{m.name}</p>
                                                                {isLocalAssigned ? (
                                                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter block font-mono">In this Class</span>
                                                                ) : others && others.length > 0 ? (
                                                                    <span className="text-[8px] font-bold text-rose-600 uppercase tracking-tighter block truncate">Already Assigned elsewhere</span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t flex justify-between items-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{selectedMasterIds.length} NEW subjects selected</p>
                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={() => setAssignOpen(false)} className="font-bold">Cancel</Button>
                                                <Button onClick={onAssign} className="font-black bg-blue-600" disabled={selectedMasterIds.length === 0 || assignMutation.isPending}>
                                                    {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Confirm Assignment
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 border-l-0 lg:border-l lg:pl-8">
                            {!selectedClassId ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-muted/5 rounded-2xl border-2 border-dashed border-muted/20">
                                    <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                        <Layers className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Selector Idle</p>
                                    <p className="text-xs text-muted-foreground mt-2">Select a class on the left to manage its active subjects.</p>
                                </div>
                            ) : isClassLoading ? (
                                <div className="space-y-3">
                                    {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-xl" />)}
                                </div>
                            ) : !classSubjects?.length ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-blue-50/10 rounded-2xl border-2 border-dashed border-blue-500/10">
                                    <p className="text-sm font-bold text-blue-600/60 uppercase tracking-widest">Zero Assignments</p>
                                    <p className="text-xs text-muted-foreground mt-2">This class has no subjects assigned yet.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                     <div className="col-span-full border-b pb-2 mb-2 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Curriculum</span>
                                        <Badge variant="secondary" className="font-bold text-[10px]">{classSubjects.length} Subjects</Badge>
                                     </div>
                                     {classSubjects.map(sub => (
                                         <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors shadow-sm">
                                             <div className="flex items-center gap-3">
                                                 <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                     <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                                 </div>
                                                  <div>
                                                      <p className="font-bold text-sm tracking-tight text-foreground uppercase">{sub.name.toUpperCase()}</p>
                                                      <p className="text-[10px] font-medium text-muted-foreground uppercase">{sub.code?.toUpperCase() || 'NO-CODE'}</p>
                                                  </div>
                                             </div>
                                             <button 
                                                 onClick={() => {
                                                     setDeleteItem({ id: sub.id, name: sub.name, type: 'assignment' });
                                                     setIsDeleteDialogOpen(true);
                                                 }}
                                                 className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors"
                                              >
                                                  <Trash2 className="h-4 w-4" />
                                              </button>
                                         </div>
                                     ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="max-w-[400px]">
                    <AlertDialogHeader>
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <AlertDialogTitle className="font-black">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium">
                            {deleteItem?.type === 'master' 
                                ? `This will permanently delete ${deleteItem.name.toUpperCase()} from the global collection. Existing assignments won't be deleted but won't refer to this pool item anymore.`
                                : `This will remove ${deleteItem?.name.toUpperCase()} from this class's active curriculum.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="font-bold rounded-xl border-2">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="font-bold rounded-xl bg-destructive hover:bg-destructive/90"
                        >
                            {deleteMaster.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Hidden Print Content */}
            {allAssignments && <CurriculumReport assignments={allAssignments} />}
        </div>
    );
}
