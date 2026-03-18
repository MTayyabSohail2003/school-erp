'use client';

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
import { AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function ClassesTable() {
    const { data: classes, isLoading, isError, error } = useClasses();
    const deleteClassMutation = useDeleteClass();

    const handleDelete = (id: string, name: string) => {
        deleteClassMutation.mutate(id, {
            onSuccess: () => {
                toast.success(`Class ${name} deleted successfully.`);
            },
            onError: (err) => {
                toast.error(`Failed to delete class: ${err.message}`);
            },
        });
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
                            <TableCell className="text-right">
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
        </div>
    );
}
