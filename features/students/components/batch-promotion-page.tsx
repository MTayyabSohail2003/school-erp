'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Users, CheckCircle, Loader2, GraduationCap } from 'lucide-react';

import { useClasses } from '@/features/classes/hooks/use-classes';
import { usePromoteStudents } from '../api/use-promote-students';
import { useStudentsByClass } from '../hooks/use-students-by-class';
import { PageTransition } from '@/components/ui/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export function BatchPromotionPage() {
    const [fromClassId, setFromClassId] = useState('');
    const [toClassId, setToClassId] = useState('');
    const [promotedCount, setPromotedCount] = useState<number | null>(null);

    const { data: classes } = useClasses();
    const { data: previewStudents } = useStudentsByClass(fromClassId);
    const promoteMutation = usePromoteStudents();

    const fromClass = classes?.find(c => c.id === fromClassId);
    const toClass = classes?.find(c => c.id === toClassId);

    const isValid = fromClassId && toClassId && fromClassId !== toClassId;

    const handleConfirm = () => {
        promoteMutation.mutate({ fromClassId, toClassId }, {
            onSuccess: (count) => {
                toast.success(`${count} students promoted to ${toClass?.name} — ${toClass?.section}`);
                setPromotedCount(count);
                setFromClassId('');
                setToClassId('');
            },
            onError: (err) => toast.error(err.message),
        });
    };

    return (
        <PageTransition>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Batch Promotion</h1>
                        <p className="text-sm text-muted-foreground">Promote all students from one class to another in one click</p>
                    </div>
                </div>

                {/* Success State */}
                {promotedCount !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3"
                    >
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            Successfully promoted <strong>{promotedCount}</strong> students. Select another batch to continue.
                        </p>
                        <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setPromotedCount(null)}>
                            Dismiss
                        </Button>
                    </motion.div>
                )}

                {/* Selector Card */}
                <Card>
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-base">Select Source & Destination</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* From Class */}
                            <div className="flex-1 w-full space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From Class</label>
                                <Select value={fromClassId} onValueChange={setFromClassId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source class…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(classes ?? []).map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name} — Section {c.section}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-5" />

                            {/* To Class */}
                            <div className="flex-1 w-full space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To Class</label>
                                <Select value={toClassId} onValueChange={setToClassId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select target class…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(classes ?? [])
                                            .filter(c => c.id !== fromClassId)
                                            .map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name} — Section {c.section}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Preview */}
                        {fromClassId && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <Users className="h-4 w-4" />
                                <span>
                                    <Badge variant="secondary" className="mr-1">{previewStudents?.length ?? 0}</Badge>
                                    students in <strong>{fromClass?.name} — {fromClass?.section}</strong> will be promoted
                                </span>
                            </motion.div>
                        )}

                        {/* Action */}
                        <div className="mt-6 flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={!isValid || promoteMutation.isPending} className="gap-2">
                                        {promoteMutation.isPending
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <GraduationCap className="h-4 w-4" />}
                                        Promote {previewStudents?.length ?? 0} Students
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Batch Promotion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will move <strong>{previewStudents?.length ?? 0}</strong> students from{' '}
                                            <strong>{fromClass?.name} — {fromClass?.section}</strong> to{' '}
                                            <strong>{toClass?.name} — {toClass?.section}</strong>.
                                            Historical records (marks, attendance) will remain linked to the original class.
                                            This action cannot be undone automatically.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleConfirm}>
                                            Yes, Promote All
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-muted/30">
                    <CardContent className="pt-5 text-sm text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-3">How it works</p>
                        <p>• Students&apos; <code className="bg-muted px-1 rounded text-xs">class_id</code> is updated to the new class.</p>
                        <p>• All prior attendance, marks, and fee records remain intact and linked to the original class.</p>
                        <p>• You can run multiple promotions (e.g., 4A → 5A, then 4B → 5B) sequentially.</p>
                        <p>• Typically run once per academic year after results are published.</p>
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    );
}
