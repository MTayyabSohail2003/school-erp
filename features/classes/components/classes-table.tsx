'use client';

import * as React from 'react';

import { useClasses, useDeleteClass } from '@/features/classes/hooks/use-classes';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordConfirmDialog } from '@/components/ui/password-confirm-dialog';
import { submitForceDeleteClass } from '@/features/classes/api/force-delete-class.action';
import { EditClassDialog } from '@/features/classes/components/edit-class-dialog';
import { type ClassRecord } from '@/features/classes/api/classes.api';

export function ClassesTable() {
    const { data: classes, isLoading, isError, error } = useClasses();
    const deleteClassMutation = useDeleteClass();

    const [forceDeleteData, setForceDeleteData] = React.useState<{ id: string; name: string; type: 'students' | 'timetable' } | null>(null);
    const [classToEdit, setClassToEdit] = React.useState<ClassRecord | null>(null);

    const handleDelete = (id: string, name: string) => {
        deleteClassMutation.mutate(id, {
            onSuccess: () => {
                toast.success(`Class ${name} deleted successfully.`);
            },
            onError: (err) => {
                if (err.message.includes('Active students')) {
                    setForceDeleteData({ id, name, type: 'students' });
                } else if (err.message.includes('timetable')) {
                    setForceDeleteData({ id, name, type: 'timetable' });
                } else {
                    toast.error(`Failed to delete class: ${err.message}`);
                }
            },
        });
    };

    const handleForceDelete = async (password: string) => {
        if (!forceDeleteData) return;
        const result = await submitForceDeleteClass(forceDeleteData.id, password);
        
        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success(`Class ${forceDeleteData.name} and all related data deleted securely.`);
        setForceDeleteData(null);
        // Force a re-fetch of classes by invalidating the query locally if needed,
        // but since we are modifying state, let's just reload the window or invalidate cache.
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="mt-8">
                <Loader size="lg" text="Loading classes..." />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 mt-4 text-red-500 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Failed to load classes: {(error as Error).message}
            </div>
        );
    }

    if (!classes || classes.length === 0) {
        return (
            <div className="mt-8 text-center p-12 border border-dashed rounded-lg bg-muted/40">
                <h3 className="text-lg font-medium">No classes configured</h3>
                <p className="text-sm text-muted-foreground mt-1">Add your first class to start registering students.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border mt-6 bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>System ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classes.map((cls) => (
                        <TableRow key={cls.id}>
                            <TableCell className="font-medium text-base">{cls.name}</TableCell>
                            <TableCell>
                                {cls.section ? <Badge variant="secondary">{cls.section}</Badge> : <span className="text-muted-foreground text-xs italic">No Section</span>}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs font-mono">
                                {cls.id.split('-')[0]}...
                            </TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                    onClick={() => setClassToEdit(cls)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete <strong>{cls.name}{cls.section ? ` - ${cls.section}` : ''}</strong>? 
                                                This action cannot be undone and may fail if students are still enrolled in this class.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(cls.id, cls.name)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <PasswordConfirmDialog
                isOpen={!!forceDeleteData}
                onOpenChange={(open) => !open && setForceDeleteData(null)}
                title="Force Delete Class"
                description={
                    <>
                        <p className="mb-2">
                            The class <strong>{forceDeleteData?.name}</strong> cannot be deleted normally because it has {forceDeleteData?.type === 'students' ? 'active students enrolled' : 'an active timetable'}.
                        </p>
                        <p className="font-semibold text-destructive">
                            CAUTION: Proceeding will permanently delete this class AND {forceDeleteData?.type === 'students' ? 'ALL ENROLLED STUDENTS' : 'ITS TIMETABLE'}.
                        </p>
                    </>
                }
                onConfirm={handleForceDelete}
            />

            <EditClassDialog 
                isOpen={!!classToEdit} 
                setIsOpen={(open) => !open && setClassToEdit(null)} 
                classData={classToEdit} 
            />
        </div>
    );
}
