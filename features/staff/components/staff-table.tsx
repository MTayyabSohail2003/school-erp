'use client';

import * as React from 'react';
import { useGetStaff } from '../api/use-get-staff';
import { useDeleteStaff } from '../api/use-delete-staff';
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
import { AlertCircle, FileText, MoreHorizontal, Pencil, Trash2, Search, ArrowUpDown, Shield, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import { EditStaffDialog } from './edit-staff-dialog';
import { AssignSubjectsDialog } from './assign-subjects-dialog';

export function StaffTable() {
    const { data: staff, isLoading, isError, error } = useGetStaff();
    const deleteMutation = useDeleteStaff();

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');

    // Action States
    const [staffToDelete, setStaffToDelete] = React.useState<{ id: string; name: string } | null>(null);
    const [staffToEdit, setStaffToEdit] = React.useState<any | null>(null);
    const [staffToAssignSubjects, setStaffToAssignSubjects] = React.useState<any | null>(null);
    const [drawerStaff, setDrawerStaff] = React.useState<any | null>(null);

    const confirmDelete = () => {
        if (!staffToDelete) return;

        const loadingToast = toast.loading(`Deleting ${staffToDelete.name}...`);
        deleteMutation.mutate(staffToDelete.id, {
            onSuccess: () => {
                toast.success('Staff record deleted successfully.', { id: loadingToast });
                setStaffToDelete(null);
                setDrawerStaff(null);
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to delete staff.', { id: loadingToast });
                setStaffToDelete(null);
            },
        });
    };

    const columns: ColumnDef<any>[] = React.useMemo(() => [
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
                        <div className="font-semibold text-foreground">{row.getValue('full_name')}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{row.original.email}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: () => (
                <Badge variant="outline" className="flex items-center gap-1 w-fit bg-secondary/30 text-foreground border-border">
                    <Shield className="w-3 h-3 text-muted-foreground" /> Teacher
                </Badge>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge variant={status === 'ACTIVE' ? 'default' : status === 'INACTIVE' ? 'secondary' : 'destructive'}
                        className={status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : ''}>
                        {status || 'ACTIVE'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => <div className="text-sm hidden md:block">{row.getValue('email')}</div>,
        },
        {
            accessorKey: 'phone_number',
            header: 'Phone',
            cell: ({ row }) => <div className="text-sm hidden md:block">{row.getValue('phone_number') || '-'}</div>,
        },
        {
            accessorKey: 'qualification',
            header: 'Quals',
            cell: ({ row }) => <div className="text-sm hidden lg:block text-muted-foreground">{row.getValue('qualification')}</div>,
        },
        {
            accessorKey: 'monthly_salary',
            header: 'Salary',
            cell: ({ row }) => <div className="text-sm hidden lg:block font-medium">${Number(row.getValue('monthly_salary')).toLocaleString()}</div>,
        },
        {
            accessorKey: 'resume_url',
            header: 'Vault',
            cell: ({ row }) => {
                const url = row.getValue('resume_url') as string;
                if (!url) return <span className="text-xs text-muted-foreground hidden lg:block">-</span>;
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="items-center text-xs text-blue-600 hover:underline hidden lg:flex" onClick={(e) => e.stopPropagation()}>
                        <FileText className="w-3 h-3 mr-1" /> CV
                    </a>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const staffMember = row.original;
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
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStaffToAssignSubjects(staffMember); }}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Assign Subjects
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStaffToEdit(staffMember); }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={(e) => { e.stopPropagation(); setStaffToDelete({ id: staffMember.id, name: staffMember.full_name }); }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Staff
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [deleteMutation]);

    const table = useReactTable({
        data: staff || [],
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
        return <div className="mt-8"><Loader size="lg" text="Loading staff records..." /></div>;
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
                        placeholder="Search staff, emails..."
                        value={globalFilter}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pl-9 bg-background w-full"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden overflow-x-auto max-w-[calc(100vw-32px)] sm:max-w-full">
                <Table className="min-w-full">
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    // Custom hiding for responsiveness
                                    const isHiddenMd = ['email', 'phone_number'].includes(header.column.id);
                                    const isHiddenLg = ['qualification', 'monthly_salary', 'resume_url'].includes(header.column.id);
                                    const isHiddenMobileAction = header.column.id === 'actions';

                                    const classes = [
                                        isHiddenMd ? 'hidden md:table-cell' : '',
                                        isHiddenLg ? 'hidden lg:table-cell' : '',
                                        isHiddenMobileAction ? 'hidden sm:table-cell' : ''
                                    ].filter(Boolean).join(' ');

                                    return (
                                        <TableHead key={header.id} className={classes}>
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
                                            setDrawerStaff(row.original);
                                        }
                                    }}
                                    className="cursor-pointer md:cursor-default hover:bg-muted/50 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const isHiddenMd = ['email', 'phone_number'].includes(cell.column.id);
                                        const isHiddenLg = ['qualification', 'monthly_salary', 'resume_url'].includes(cell.column.id);
                                        const isHiddenMobileAction = cell.column.id === 'actions';

                                        const classes = [
                                            isHiddenMd ? 'hidden md:table-cell' : '',
                                            isHiddenLg ? 'hidden lg:table-cell' : '',
                                            isHiddenMobileAction ? 'hidden sm:table-cell' : ''
                                        ].filter(Boolean).join(' ');

                                        return (
                                            <TableCell key={cell.id} className={classes}>
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
            <Drawer open={!!drawerStaff} onOpenChange={(o) => (!o && setDrawerStaff(null))}>
                <DrawerContent>
                    <div className="w-full">
                        <DrawerHeader>
                            <DrawerTitle className="text-xl">{drawerStaff?.full_name}</DrawerTitle>
                            <DrawerDescription>{drawerStaff?.email}</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Role</p>
                                    <p className="font-medium">Teacher</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                                    <Badge variant="outline" className="mt-1">{drawerStaff?.status || 'ACTIVE'}</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Phone</p>
                                    <p className="font-medium">{drawerStaff?.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Salary</p>
                                    <p className="font-medium">${Number(drawerStaff?.monthly_salary || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Qualification</p>
                                <p className="font-medium">{drawerStaff?.qualification || 'N/A'}</p>
                            </div>
                            {drawerStaff?.resume_url && (
                                <div className="pt-2">
                                    <a href={drawerStaff.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                        <FileText className="w-4 h-4 mr-2" /> View Vault Document
                                    </a>
                                </div>
                            )}
                        </div>
                        <DrawerFooter className="flex-col gap-2 pt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => { setStaffToEdit(drawerStaff); setDrawerStaff(null); }}
                            >
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => { setStaffToDelete({ id: drawerStaff.id, name: drawerStaff.full_name }); }}
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
            <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the staff record for <strong>{staffToDelete?.name}</strong> and remove their data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Staff'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditStaffDialog
                isOpen={!!staffToEdit}
                setIsOpen={(open) => !open && setStaffToEdit(null)}
                staffMember={staffToEdit}
            />

            <AssignSubjectsDialog
                isOpen={!!staffToAssignSubjects}
                setIsOpen={(open) => !open && setStaffToAssignSubjects(null)}
                teacher={staffToAssignSubjects}
            />
        </div>
    );
}
