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

import { EditStudentDialog } from './edit-student-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDeleteStudent } from '../api/use-delete-student';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useTeacherClasses } from '@/features/classes/hooks/use-teacher-classes';

export function StudentsTable() {
    const { data: profile, isLoading: profileLoading } = useAuthProfile();
    const isTeacher = profile?.role === 'TEACHER';
    const isParent = profile?.role === 'PARENT';

    // Fetch managed classes for teacher to filter students
    const { data: teacherClassesData } = useTeacherClasses();
    const teacherClasses = teacherClassesData?.map(c => c.id);

    const { data: students, isLoading: studentsLoading, isError, error } = useStudents({
        parentId: isParent ? profile?.id : undefined,
        classIds: isTeacher ? teacherClasses : undefined
    });
    const deleteMutation = useDeleteStudent();

    const isLoading = studentsLoading || profileLoading;

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<string>('All');
    const [activeSection, setActiveSection] = React.useState<string>('All');

    const uniqueClasses = React.useMemo(() => {
        if (!students) return [];
        const classes = new Set(students.map((s: any) => s.classes?.name).filter(Boolean));
        return Array.from(classes).sort((a: any, b: any) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            if (numA === numB) return a.localeCompare(b);
            return numA - numB;
        }) as string[];
    }, [students]);

    const uniqueSections = React.useMemo(() => {
        if (!students) return [];
        let filtered = students;
        if (activeTab !== 'All') {
            filtered = students.filter((s: any) => s.classes?.name === activeTab);
        }
        const sections = new Set(filtered.map((s: any) => s.classes?.section).filter(Boolean));
        return Array.from(sections).sort() as string[];
    }, [students, activeTab]);

    const handleClassTabChange = (className: string) => {
        setActiveTab(className);
        setActiveSection('All');
        table.getColumn('class_section')?.setFilterValue({ className, section: 'All' });
    };

    const handleSectionTabChange = (section: string) => {
        setActiveSection(section);
        table.getColumn('class_section')?.setFilterValue({ className: activeTab, section });
    };

    // Action States
    const [studentToDelete, setStudentToDelete] = React.useState<{ id: string; name: string } | null>(null);
    const [studentToEdit, setStudentToEdit] = React.useState<any | null>(null);
    const [drawerStudent, setDrawerStudent] = React.useState<any | null>(null);
    const [photoViewerUrl, setPhotoViewerUrl] = React.useState<string | null>(null);

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
                    {row.original.photo_url ? (
                        <div 
                            className="h-8 w-8 rounded-full overflow-hidden border shadow-sm hidden sm:block shrink-0 cursor-pointer ring-offset-2 hover:ring-2 ring-primary/50 transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPhotoViewerUrl(row.original.photo_url);
                            }}
                        >
                            <img src={row.original.photo_url} alt="Photo" className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase hidden sm:flex shrink-0">
                            {(row.getValue('full_name') as string).substring(0, 2)}
                        </div>
                    )}
                    <div>
                        <div className="font-semibold text-foreground">{row.getValue('full_name')}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{row.original.classes?.name} - {row.original.classes?.section}</div>
                    </div>
                </div>
            ),
        },
        {
            id: 'parent_name',
            accessorFn: row => row.users?.full_name || '-',
            header: 'Parent/Guardian',
            cell: ({ row }) => <div className="text-sm hidden md:block">{row.original.users?.full_name || '-'}</div>,
        },
        {
            id: 'class_section',
            accessorFn: row => `${row.classes?.name} ${row.classes?.section}`,
            header: 'Class',
            filterFn: (row, columnId, filterValue) => {
                if (!filterValue || typeof filterValue !== 'object') return true;
                const { className, section } = filterValue as any;
                const matchClass = !className || className === 'All' || row.original.classes?.name === className;
                const matchSection = !section || section === 'All' || row.original.classes?.section === section;
                return matchClass && matchSection;
            },
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
                        className={status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : ''}>
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
            accessorKey: 'monthly_fee',
            header: 'Fee',
            cell: ({ row }) => {
                const fee = row.getValue('monthly_fee') as number | null;
                return (
                    <div className="text-sm font-medium hidden lg:block">
                        {fee ? `Rs. ${fee.toLocaleString()}` : <span className="text-xs text-muted-foreground italic">Default</span>}
                    </div>
                );
            },
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
                if (isParent || isTeacher) return null;
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
            <div className="flex flex-col gap-4 py-4 bg-card px-4 border rounded-xl shadow-sm min-w-0">
                <div className="flex flex-col gap-4 w-full">
                    <div className="relative w-full md:max-w-xs shrink-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            value={globalFilter}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="pl-9 bg-background w-full"
                        />
                    </div>

                    {/* Dynamic Class Filter Tabs */}
                    {uniqueClasses.length > 0 && (
                        <div
                            className="flex w-full items-center gap-2 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden"
                            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                        >
                            <span className="text-sm font-medium text-muted-foreground shrink-0 mr-1 hidden md:block">Classes:</span>
                            <Button
                                variant={activeTab === 'All' ? 'default' : 'secondary'}
                                size="sm"
                                className="rounded-full shrink-0"
                                onClick={() => handleClassTabChange('All')}
                            >
                                All Classes
                            </Button>
                            {uniqueClasses.map((className) => (
                                <Button
                                    key={className}
                                    variant={activeTab === className ? 'default' : 'secondary'}
                                    size="sm"
                                    className="rounded-full shrink-0"
                                    onClick={() => handleClassTabChange(className)}
                                >
                                    {className}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dynamic Section Filter Tabs */}
                {uniqueSections.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden">
                        <span className="text-sm font-medium text-muted-foreground shrink-0 mr-1 hidden md:block">Sections:</span>
                        <Button
                            variant={activeSection === 'All' ? 'default' : 'secondary'}
                            size="sm"
                            className="rounded-full shrink-0"
                            onClick={() => handleSectionTabChange('All')}
                        >
                            All Sections
                        </Button>
                        {uniqueSections.map((section) => (
                            <Button
                                key={section}
                                variant={activeSection === section ? 'default' : 'secondary'}
                                size="sm"
                                className="rounded-full shrink-0"
                                onClick={() => handleSectionTabChange(section)}
                            >
                                Section {section}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden overflow-x-auto max-w-[calc(100vw-32px)] sm:max-w-full">
                <Table className="min-w-full">
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    // Custom hiding for responsiveness
                                    const isHiddenOnMobile = ['parent_name', 'class_section', 'date_of_birth', 'b_form_url', 'actions'].includes(header.column.id);

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
                                        const isHiddenOnMobile = ['parent_name', 'class_section', 'date_of_birth', 'b_form_url', 'actions'].includes(cell.column.id);
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
                    <div className="w-full">
                        <DrawerHeader className="flex items-center gap-4 text-left">
                            {drawerStudent?.photo_url ? (
                                <img 
                                    src={drawerStudent.photo_url} 
                                    alt="Photo" 
                                    className="w-12 h-12 rounded-full object-cover border shadow-sm shrink-0 cursor-pointer ring-offset-2 hover:ring-2 ring-primary/50 transition-all" 
                                    onClick={() => setPhotoViewerUrl(drawerStudent.photo_url)}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
                                    {(drawerStudent?.full_name as string)?.substring(0, 2) || ''}
                                </div>
                            )}
                            <div>
                                <DrawerTitle className="text-xl">{drawerStudent?.full_name}</DrawerTitle>
                                <DrawerDescription>Roll No: {drawerStudent?.roll_number}</DrawerDescription>
                            </div>
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
                                <p className="font-medium">{drawerStudent?.users?.full_name || 'N/A'}</p>
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
                        <DrawerFooter className="flex-col gap-2 pt-6">
                            {!isParent && !isTeacher && (
                                <>
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
                                </>
                            )}
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

            {/* Photo Lightbox */}
            <Dialog open={!!photoViewerUrl} onOpenChange={(open) => !open && setPhotoViewerUrl(null)}>
                <DialogContent className="sm:max-w-md p-1 bg-transparent border-none shadow-none">
                    <div className="relative w-full overflow-hidden rounded-xl aspect-square bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl">
                        {photoViewerUrl && (
                            <img 
                                src={photoViewerUrl} 
                                alt="Student Portrait" 
                                className="w-full h-full object-contain" 
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
