'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Trash2, BookOpen, CalendarRange } from 'lucide-react';

import { useGetExams, useDeleteExam } from '../api/use-exams';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { AddExamDialog } from './add-exam-dialog';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EXAM_TERMS } from '../schemas/exam.schema';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ExamsPage() {
    const { data: profile } = useAuthProfile();
    const isAdmin = profile?.role === 'ADMIN';
    const { data: exams, isLoading } = useGetExams();
    const deleteMutation = useDeleteExam();

    const handleDelete = (id: string, title: string) => {
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success(`"${title}" deleted.`),
            onError: (err) => toast.error(err.message),
        });
    };

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
                            <p className="text-sm text-muted-foreground">Manage exam sessions and schedules</p>
                        </div>
                    </div>
                    {isAdmin && <AddExamDialog />}
                </div>

                {/* Exams list */}
                {isLoading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-36 rounded-xl" />
                        ))}
                    </div>
                )}

                {!isLoading && (exams ?? []).length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-muted-foreground">No exams created yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                Click &quot;Create Exam&quot; to add your first exam session.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && (exams ?? []).length > 0 && (
                    <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(exams ?? []).map((exam) => (
                            <StaggerItem key={exam.id}>
                                <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
                                    <Card className="h-full border hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-base leading-tight">{exam.title}</CardTitle>
                                                {isAdmin && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete &quot;{exam.title}&quot; and all its associated marks. This cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(exam.id, exam.title)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CalendarRange className="h-4 w-4 text-primary" />
                                                <span>
                                                    {format(new Date(exam.start_date), 'MMM d')} —{' '}
                                                    {format(new Date(exam.end_date), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20 bg-primary/5">
                                                    {EXAM_TERMS.find(t => t.value === exam.term)?.label || 'Unit Test'}
                                                </Badge>
                                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                    Created {format(new Date(exam.created_at), 'MMM d, yy')}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                )}
            </div>
        </PageTransition>
    );
}
