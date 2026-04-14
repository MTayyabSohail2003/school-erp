'use client';

import * as React from 'react';
import { useStudents } from '@/features/students/hooks/use-students';
import NextImage from 'next/image';
import { getClassRank } from '@/features/classes/utils/class-sorting';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AlertCircle, FileText, MoreHorizontal, Pencil, Trash2, Search, ArrowUpDown, Users } from 'lucide-react';
import { toast } from 'sonner';

import { EditStudentDialog } from './edit-student-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import { useDeleteStudent } from '../api/use-delete-student';
import { useDeleteBulkStudents } from '../api/use-delete-bulk-students';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useTeacherClasses } from '@/features/classes/hooks/use-teacher-classes';
import { Checkbox } from '@/components/ui/checkbox';
import { type Student } from '../schemas/student.schema';

type StudentWithRelations = Omit<Student, 'id'> & { 
    id: string; // id is required in the UI
    classes?: { name: string; section: string };
    users?: { full_name: string };
};

export function StudentsTable() {
    const { data: profile, isLoading: profileLoading } = useAuthProfile();
    const isTeacher = profile?.role === 'TEACHER';
    const isParent = profile?.role === 'PARENT';

    // Fetch managed classes for teacher to filter students
    const { data: teacherClassesData } = useTeacherClasses();
    const teacherClasses = teacherClassesData?.map(c => c.id);

    const [selectedStatus, setSelectedStatus] = React.useState<'ACTIVE' | 'GRADUATED'>('ACTIVE');

    const { data: students, isLoading: studentsLoading, isError, error } = useStudents({
        parentId: isParent ? profile?.id : undefined,
        classIds: isTeacher ? teacherClasses : undefined,
        status: selectedStatus
    });
    const deleteMutation = useDeleteStudent();
    const bulkDeleteMutation = useDeleteBulkStudents();

    const isLoading = studentsLoading || profileLoading;

    const [sorting, setSorting] = React.useState<SortingState>([{ id: 'roll_number', desc: false }]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [rowSelection, setRowSelection] = React.useState({});
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<string>('All');
    const [activeSection, setActiveSection] = React.useState<string>('All');
    const [activeYear, setActiveYear] = React.useState<string>('All');

    const uniqueYears = React.useMemo(() => {
        if (!students || selectedStatus !== 'GRADUATED') return [];
        const years = new Set(students.map((s) => s.academic_year).filter(Boolean));
        return Array.from(years).sort().reverse() as string[];
    }, [students, selectedStatus]);

    const uniqueClasses = React.useMemo(() => {
        if (!students) return [];
        const classes = new Set(students.map((s) => s.classes?.name).filter(Boolean));
        return Array.from(classes).sort((a: string, b: string) => {
            return getClassRank(a) - getClassRank(b);
        }) as string[];
    }, [students]);

    const uniqueSections = React.useMemo(() => {
        if (!students) return [];
        let filtered = students as StudentWithRelations[];
        if (activeTab !== 'All') {
            filtered = (students as StudentWithRelations[]).filter((s) => s.classes?.name === activeTab);
        }
        const sections = new Set(filtered.map((s) => s.classes?.section).filter(Boolean));
        return Array.from(sections).sort() as string[];
    }, [students, activeTab]);



    // Action States
    const [studentToDelete, setStudentToDelete] = React.useState<{ id: string; name: string } | null>(null);
    const [studentToEdit, setStudentToEdit] = React.useState<StudentWithRelations | null>(null);
    const [drawerStudent, setDrawerStudent] = React.useState<StudentWithRelations | null>(null);
    const [photoViewerUrl, setPhotoViewerUrl] = React.useState<string | null>(null);



    const columns: ColumnDef<StudentWithRelations>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        } as ColumnDef<StudentWithRelations>,
        {
            accessorKey: 'roll_number',
            header: 'Roll No',
            cell: ({ row }) => <div className="font-medium">{row.getValue('roll_number')}</div>,
        } as ColumnDef<StudentWithRelations>,
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
                    <ImagePreviewDialog 
                        src={row.original.photo_url} 
                        title={row.getValue('full_name')} 
                        description={`Roll ID: ${row.getValue('roll_number')}`}
                    >
                        <div className="h-8 w-8 rounded-full overflow-hidden border shadow-sm hidden sm:block shrink-0 cursor-pointer ring-offset-2 hover:ring-2 ring-primary/50 transition-all">
                            {row.original.photo_url ? (
                                <NextImage 
                                    src={row.original.photo_url} 
                                    alt="Photo" 
                                    width={32} 
                                    height={32} 
                                    className="h-full w-full object-cover" 
                                    unoptimized={row.original.photo_url.startsWith('data:')}
                                />
                            ) : (
                                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase italic drop-shadow-sm">
                                    {(row.getValue('full_name') as string).substring(0, 2)}
                                </div>
                            )}
                        </div>
                    </ImagePreviewDialog>
                    <div>
                        <div className="font-semibold text-foreground">{row.getValue('full_name')}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{(row.original as StudentWithRelations).classes?.name} - {(row.original as StudentWithRelations).classes?.section}</div>
                    </div>
                </div>
            ),
        } as ColumnDef<StudentWithRelations>,
        {
            id: 'parent_name',
            accessorFn: row => (row as StudentWithRelations).users?.full_name || '-',
            header: 'Parent/Guardian',
            cell: ({ row }) => <div className="text-sm hidden md:block">{(row.original as StudentWithRelations).users?.full_name || '-'}</div>,
        } as ColumnDef<StudentWithRelations>,
        {
            id: 'class_section',
            accessorFn: row => `${(row as StudentWithRelations).classes?.name} ${(row as StudentWithRelations).classes?.section}`,
            header: 'Class',
            filterFn: (row, columnId, filterValue) => {
                if (!filterValue || typeof filterValue !== 'object') return true;
                const { className, section } = filterValue as { className: string; section: string };
                const original = row.original as StudentWithRelations;
                const matchClass = !className || className === 'All' || original.classes?.name === className;
                const matchSection = !section || section === 'All' || original.classes?.section === section;
                return matchClass && matchSection;
            },
            cell: ({ row }) => (
                <div className="hidden md:flex gap-2">
                    <Badge variant="outline">{(row.original as StudentWithRelations).classes?.name || 'Unknown'}</Badge>
                    <Badge variant="secondary">{(row.original as StudentWithRelations).classes?.section || '-'}</Badge>
                </div>
            ),
        } as ColumnDef<StudentWithRelations>,
        {
            accessorKey: 'academic_year',
            header: selectedStatus === 'GRADUATED' ? 'Graduation Year' : 'Academic Year',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-bold bg-primary/5 text-primary border-primary/20">
                    {row.getValue('academic_year')}
                </Badge>
            ),
        } as ColumnDef<StudentWithRelations>,
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
        } as ColumnDef<StudentWithRelations>,
        {
            accessorKey: 'date_of_birth',
            header: 'DOB',
            cell: ({ row }) => <div className="text-muted-foreground text-sm hidden lg:block">{new Date(row.getValue('date_of_birth') as string).toLocaleDateString()}</div>,
        } as ColumnDef<StudentWithRelations>,
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
        } as ColumnDef<StudentWithRelations>,
        {
            accessorKey: 'b_form_url',
            header: 'Vault',
            cell: ({ row }) => {
                const url = row.getValue('b_form_url') as string;
                if (!url) return <span className="text-xs text-muted-foreground hidden md:block">-</span>;
                return (
                    <ImagePreviewDialog 
                        src={url} 
                        title={`${row.getValue('full_name')} - Vault Document`}
                        description="B-Form / ID Card Preview"
                    >
                        <div className="items-center text-xs text-blue-600 hover:underline hidden md:flex font-bold tracking-tight">
                            <FileText className="w-3 h-3 mr-1" /> View Vault
                        </div>
                    </ImagePreviewDialog>
                );
            },
        } as ColumnDef<StudentWithRelations>,
        {
            id: 'actions',
            cell: ({ row }) => {
                if (isParent || isTeacher) return null;
                const student = row.original as StudentWithRelations;
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

    const table = useReactTable<StudentWithRelations>({
        data: (students || []) as StudentWithRelations[],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
        },
    });

    const handleClassTabChange = (className: string) => {
        setActiveTab(className);
        setActiveSection('All');
        table.getColumn('class_section')?.setFilterValue({ className, section: 'All' });
    };

    const handleSectionTabChange = (section: string) => {
        setActiveSection(section);
        table.getColumn('class_section')?.setFilterValue({ className: activeTab, section });
    };

    const handleYearTabChange = (year: string) => {
        setActiveYear(year);
        if (year === 'All') {
            table.getColumn('academic_year')?.setFilterValue(undefined);
        } else {
            table.getColumn('academic_year')?.setFilterValue(year);
        }
    };

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

    const confirmBulkDelete = () => {
        setIsBulkDeleteOpen(true);
    };

    const executeBulkDelete = () => {
        const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id as string);
        if (selectedIds.length === 0) return;

        const loadingToast = toast.loading(`Deleting ${selectedIds.length} students...`);
        bulkDeleteMutation.mutate(selectedIds, {
            onSuccess: () => {
                toast.success('Selected records deleted successfully.', { id: loadingToast });
                setRowSelection({});
                setIsBulkDeleteOpen(false);
            },
            onError: (err: Error) => {
                toast.error(err.message || 'Failed to delete records.', { id: loadingToast });
                setIsBulkDeleteOpen(false);
            },
        });
    };

    if (isTeacher && teacherClasses?.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border-2 border-dashed border-muted rounded-3xl text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-primary" />
                </div>
                <div className="max-w-xs">
                    <h3 className="text-xl font-bold tracking-tight">Access Restricted</h3>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                        You have not been assigned to any classes yet. Please contact your administrator to get access to student records.
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl font-bold">
                    Check Assignment
                </Button>
            </div>
        );
    }

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
        <div className="space-y-6">
            {/* Status Tabs */}
            <Tabs 
                value={selectedStatus} 
                onValueChange={(val) => {
                    const status = val as 'ACTIVE' | 'GRADUATED';
                    setSelectedStatus(status);
                    // Reset filters on tab switch
                    setActiveTab('All');
                    setActiveSection('All');
                    setActiveYear('All');
                    table.getColumn('academic_year')?.setFilterValue(undefined);
                    table.getColumn('class_section')?.setFilterValue({ className: 'All', section: 'All' });
                }}
                className="w-full"
            >
                <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl border w-full sm:w-auto grid grid-cols-2 sm:flex">
                    <TabsTrigger 
                        value="ACTIVE" 
                        className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        Active Students
                    </TabsTrigger>
                    <TabsTrigger 
                        value="GRADUATED" 
                        className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        Graduated
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="space-y-4">
            {/* Top Bar for PWA */}
            <div className="flex flex-col gap-4 py-4 bg-card px-4 border rounded-xl shadow-sm min-w-0">
                <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center justify-between">
                    <div className="relative w-full md:max-w-xs shrink-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            value={globalFilter}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="pl-9 bg-background w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 flex-1 sm:flex-none justify-center rounded-lg font-bold text-sm shrink-0">
                        <Users className="w-4 h-4" />
                        {table.getFilteredRowModel().rows.length} Student{table.getFilteredRowModel().rows.length === 1 ? '' : 's'} Found
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Dynamic Filters based on Status */}
                    {selectedStatus === 'ACTIVE' ? (
                        uniqueClasses.length > 0 && (
                            <div
                                className="flex items-center gap-2 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden flex-1"
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
                        )
                    ) : (
                        uniqueYears.length > 0 && (
                            <div
                                className="flex items-center gap-2 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden flex-1"
                                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                            >
                                <span className="text-sm font-medium text-muted-foreground shrink-0 mr-1 hidden md:block">Graduation Years:</span>
                                <Button
                                    variant={activeYear === 'All' ? 'default' : 'secondary'}
                                    size="sm"
                                    className="rounded-full shrink-0"
                                    onClick={() => handleYearTabChange('All')}
                                >
                                    All Years
                                </Button>
                                {uniqueYears.map((year) => (
                                    <Button
                                        key={year}
                                        variant={activeYear === year ? 'default' : 'secondary'}
                                        size="sm"
                                        className="rounded-full shrink-0"
                                        onClick={() => handleYearTabChange(year)}
                                    >
                                        {year}
                                    </Button>
                                ))}
                            </div>
                        )
                    )}

                    {/* Bulk Actions */}
                    {Object.keys(rowSelection).length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                                {Object.keys(rowSelection).length} Selected
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={confirmBulkDelete}
                                className="gap-2"
                                disabled={bulkDeleteMutation.isPending}
                            >
                                <Trash2 className="w-4 h-4" />
                                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                            </Button>
                        </div>
                    )}
                </div>


                {/* Dynamic Section Filter Tabs - Only for Active Students */}
                {selectedStatus === 'ACTIVE' && uniqueSections.length > 0 && (
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
                                            setDrawerStudent(row.original as StudentWithRelations);
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
                                <NextImage 
                                    src={drawerStudent.photo_url} 
                                    alt="Photo" 
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full object-cover border shadow-sm shrink-0 cursor-pointer ring-offset-2 hover:ring-2 ring-primary/50 transition-all" 
                                    onClick={() => setPhotoViewerUrl(drawerStudent.photo_url || null)}
                                    unoptimized={drawerStudent.photo_url.startsWith('data:')}
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
                                        onClick={() => { if (drawerStudent) { setStudentToEdit(drawerStudent); setDrawerStudent(null); } }}
                                    >
                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => { if (drawerStudent) { setStudentToDelete({ id: drawerStudent.id, name: drawerStudent.full_name }); } }}
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

            {/* Bulk Delete Confirmation */}
            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{Object.keys(rowSelection).length}</strong> student record{Object.keys(rowSelection).length === 1 ? '' : 's'}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); executeBulkDelete(); }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={bulkDeleteMutation.isPending}
                        >
                            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selection'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditStudentDialog
                isOpen={!!studentToEdit}
                setIsOpen={(open) => !open && setStudentToEdit(null)}
                student={studentToEdit}
            />

            <Dialog open={!!photoViewerUrl} onOpenChange={(open) => !open && setPhotoViewerUrl(null)}>
                <DialogContent className="sm:max-w-md p-1 bg-transparent border-none shadow-none">
                    <DialogTitle className="sr-only">Student Photo Preview</DialogTitle>
                    <div className="relative w-full overflow-hidden rounded-xl aspect-square bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl">
                        {photoViewerUrl && (
                            <NextImage 
                                src={photoViewerUrl} 
                                alt="Student Portrait" 
                                fill
                                className="w-full h-full object-contain" 
                                unoptimized={photoViewerUrl.startsWith('data:')}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>
);
}
