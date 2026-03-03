'use client';

import { useState } from 'react';
import { useStudents } from '@/features/students/hooks/use-students';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useDeleteStudent } from '../api/use-delete-student';
import { EditStudentDialog } from './edit-student-dialog';

type StudentRow = {
    id: string;
    roll_number: string;
    full_name: string;
    date_of_birth: string;
    class_id: string;
};

export function StudentsTable() {
    const { data: students, isLoading, isError, error } = useStudents();
    const deleteMutation = useDeleteStudent();
    const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<StudentRow | null>(null);

    const confirmDelete = () => {
        if (!studentToDelete) return;

        const loadingToast = toast.loading(`Deleting ${studentToDelete.name}...`);
        deleteMutation.mutate(studentToDelete.id, {
            onSuccess: () => {
                toast.success('Student record deleted successfully.', { id: loadingToast });
                setStudentToDelete(null);
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to delete student.', { id: loadingToast });
                setStudentToDelete(null);
            },
        });
    };

    if (isLoading) {
        return (
            <div className="mt-8">
                <Loader size="lg" text="Loading student records..." />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 mt-4 text-red-500 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Failed to load student records: {(error as Error).message}
            </div>
        );
    }

    if (!students || students.length === 0) {
        return (
            <div className="mt-8 text-center p-12 border border-dashed rounded-lg bg-muted/40">
                <h3 className="text-lg font-medium text-slate-900">No students found</h3>
                <p className="text-sm text-slate-500 mt-1">Register a new student to see them here.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border mt-6 bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Class & Section</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Vault</TableHead>
                        <TableHead className="text-right">Enrolled</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.roll_number}</TableCell>
                            <TableCell>{student.full_name}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Badge variant="outline">{student.classes?.name || 'Unknown'}</Badge>
                                    <Badge variant="secondary">{student.classes?.section || '-'}</Badge>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {new Date(student.date_of_birth).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                {student.b_form_url ? (
                                    <a href={student.b_form_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 hover:underline">
                                        <FileText className="w-3 h-3 mr-1" /> View B-Form
                                    </a>
                                ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                                {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'Just now'}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => setStudentToEdit({
                                            id: student.id || '',
                                            roll_number: student.roll_number,
                                            full_name: student.full_name,
                                            date_of_birth: student.date_of_birth,
                                            class_id: student.class_id || '',
                                        })}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Record
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600"
                                            onClick={() => setStudentToDelete({ id: student.id || '', name: student.full_name })}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Student
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the student record for <strong>{studentToDelete?.name}</strong> and remove their data from our servers. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent closing immediately to show loading state if needed
                                confirmDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Student'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditStudentDialog
                isOpen={!!studentToEdit}
                setIsOpen={(open) => !open && setStudentToEdit(null)}
                student={studentToEdit}
            />
        </div>
    );
}
