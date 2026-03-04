'use client';

import * as React from 'react';
import { useStudents } from '@/features/students/hooks/use-students';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
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
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { AlertCircle, FileText, MoreHorizontal, Pencil, Trash2, Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { useDeleteStudent } from '../api/use-delete-student';
import { EditStudentDialog } from './edit-student-dialog';
import { Student } from '../schemas/student.schema';

export function StudentsTable() {
    const { data: students, isLoading, isError, error } = useStudents();
    const deleteMutation = useDeleteStudent();

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');

    // Action States
    const [studentToDelete, setStudentToDelete] = React.useState<{ id: string; name: string } | null>(null);
    const [studentToEdit, setStudentToEdit] = React.useState<any | null>(null);
    const [drawerStudent, setDrawerStudent] = React.useState<any | null>(null);

    const confirmDelete = () => {
        if (!studentToDelete) return;

        const loadingToast = toast.loading(`Deleting ${studentToDelete.name}...`);
        deleteMutation.mutate(studentToDelete.id, {
            onSuccess: () => {
                toast.success('Student record deleted successfully.', { id: loadingToast });
                setStudentToDelete(null);
                setDrawerStudent(null);
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to delete student.', { id: loadingToast });
                setStudentToDelete(null);
            },
        });
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'roll_number',
            header: 'Roll No',
            cell: ({ row }) => <div className="font-medium">{row.getValue('roll_number')}</div>,
        },
        {
            accessorKey: 'full_name',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 h-8 data-[state=open]:bg-accent"
                    >
                        Full Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase hidden sm:flex">
                        {(row.getValue('full_name') as string).substring(0, 2)}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">{row.getValue('full_name')}</div>
                        <div className="text-xs text-slate-500 md:hidden">{row.original.classes?.name} - {row.original.classes?.section}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'guardian_name',
            header: 'Guardian',
            cell: ({ row }) => <div className="text-sm hidden md:block">{row.getValue('guardian_name') || '-'}</div>,
        },
        {
            id: 'class_section',
            accessorFn: row => `${row.classes?.name} ${row.classes?.section}`,
            header: 'Class',
            cell: ({ row }) => (
                <div className="hidden md:flex gap-2">
                    <Badge variant="outline">{row.original.classes?.name || 'Unknown'}</Badge>
                    <Badge variant="secondary">{row.original.classes?.section || '-'}</Badge>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge variant={status === 'ACTIVE' ? 'default' : status === 'INACTIVE' ? 'secondary' : 'destructive'}
                        className={status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                        {status || 'ACTIVE'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'date_of_birth',
            header: 'DOB',
            cell: ({ row }) => <div className="text-muted-foreground text-sm hidden lg:block">{new Date(row.getValue('date_of_birth')).toLocaleDateString()}</div>,
        },
        {
            accessorKey: 'b_form_url',
            header: 'Vault',
            cell: ({ row }) => {
                const url = row.getValue('b_form_url') as string;
                if (!url) return <span className="text-xs text-muted-foreground hidden md:block">-</span>;
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="items-center text-xs text-blue-600 hover:underline hidden md:flex" onClick={(e) => e.stopPropagation()}>
                        <FileText className="w-3 h-3 mr-1" /> View Form
                    </a>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const student = row.original;
                return (
                    <div className="text-right hidden sm:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStudentToEdit(student); }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={(e) => { e.stopPropagation(); setStudentToDelete({ id: student.id, name: student.full_name }); }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Student
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: students || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    });

    if (isLoading) {
        return <div className="mt-8"><Loader size="lg" text="Loading student records..." /></div>;
    }

    if (isError) {
        return (
            <div className="p-4 mt-4 text-red-500 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Failed to load records: {(error as Error).message}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top Bar for PWA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 py-4 bg-card px-4 border rounded-xl shadow-sm">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students..."
                        value={globalFilter}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pl-9 bg-background w-full"
                    />
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2 sm:ml-auto">
                    <Input
                        placeholder="Filter by Class..."
                        value={(table.getColumn('class_section')?.getFilterValue() as string) ?? ''}
                        onChange={(event) => table.getColumn('class_section')?.setFilterValue(event.target.value)}
                        className="w-full sm:max-w-[150px] bg-background"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    // Custom hiding for responsiveness
                                    const isHiddenOnMobile = ['guardian_name', 'class_section', 'date_of_birth', 'b_form_url', 'actions'].includes(header.column.id);

                                    return (
                                        <TableHead key={header.id} className={isHiddenOnMobile ? 'hidden md:table-cell' : ''}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => {
                                        // On Mobile, opening drawer
                                        if (window.innerWidth < 768) {
                                            setDrawerStudent(row.original);
                                        }
                                    }}
                                    className="cursor-pointer md:cursor-default hover:bg-muted/50 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const isHiddenOnMobile = ['guardian_name', 'class_section', 'date_of_birth', 'b_form_url', 'actions'].includes(cell.column.id);
                                        return (
                                            <TableCell key={cell.id} className={isHiddenOnMobile ? 'hidden md:table-cell' : ''}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Mobile PWA Drawer for Hidden Details */}
            <Drawer open={!!drawerStudent} onOpenChange={(o) => (!o && setDrawerStudent(null))}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle className="text-xl">{drawerStudent?.full_name}</DrawerTitle>
                            <DrawerDescription>Roll No: {drawerStudent?.roll_number}</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Class</p>
                                    <p className="font-medium">{drawerStudent?.classes?.name} - {drawerStudent?.classes?.section}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                                    <Badge variant="outline" className="mt-1">{drawerStudent?.status || 'ACTIVE'}</Badge>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Guardian</p>
                                <p className="font-medium">{drawerStudent?.guardian_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">DOB</p>
                                <p className="font-medium">{drawerStudent?.date_of_birth ? new Date(drawerStudent?.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            {drawerStudent?.b_form_url && (
                                <div className="pt-2">
                                    <a href={drawerStudent.b_form_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                        <FileText className="w-4 h-4 mr-2" /> View Vault Document
                                    </a>
                                </div>
                            )}
                        </div>
                        <DrawerFooter className="flex-row justify-between pt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => { setStudentToEdit(drawerStudent); setDrawerStudent(null); }}
                            >
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => { setStudentToDelete({ id: drawerStudent.id, name: drawerStudent.full_name }); }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                        </DrawerFooter>
                        <div className="px-4 pb-4">
                            <DrawerClose asChild>
                                <Button variant="ghost" className="w-full text-muted-foreground">Close</Button>
                            </DrawerClose>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Editing / Deleting Dialogs */}
            <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the student record for <strong>{studentToDelete?.name}</strong> and remove their data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
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
