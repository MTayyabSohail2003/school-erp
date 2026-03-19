'use client';

import { useState } from 'react';


import { useGetParents } from '@/features/parents/api/use-get-parents';
import { useRealtimeInvalidation } from '@/hooks/use-realtime-invalidation';
import { EditParentDialog } from '@/features/parents/components/edit-parent-dialog';
import { SingleReminderButton } from '@/features/parents/components/single-reminder-button';
import { useDeleteParent } from '@/features/parents/hooks/use-delete-parent';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, User, Loader2, AlertCircle, Trash2, Search, GraduationCap, ChevronDown } from 'lucide-react';

export function ParentsTable() {
    // 1. Listen for real-time changes to the users table specifically pointing to parents
    useRealtimeInvalidation('users', ['parents'], "role=eq.PARENT");

    const deleteMutation = useDeleteParent();

    const { data: parents, isLoading, error } = useGetParents();

    const [searchQuery, setSearchQuery] = useState('');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10 text-muted-foreground border rounded-md bg-card">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading parents...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center py-10 text-destructive border rounded-md">
                <AlertCircle className="w-5 h-5 mr-2" />
                Failed to load parents.
            </div>
        );
    }

    const filteredParents = (parents || []).filter((parent) => {
        const query = searchQuery.toLowerCase();
        const parentNameMatch = parent.full_name?.toLowerCase().includes(query);
        const childMatch = parent.students?.some((student: { full_name: string }) => 
            student.full_name?.toLowerCase().includes(query)
        );
        return parentNameMatch || childMatch;
    });

    if (filteredParents.length === 0 && !searchQuery) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <h3 className="text-sm font-medium">No parents found</h3>
                <p className="text-xs mt-1">Add a new parent using the button above.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm relative">
                <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                <Input
                    placeholder="Search by parent or student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white"
                />
            </div>

            <div className="border rounded-md overflow-hidden bg-background shadow-sm">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Contact Information</TableHead>
                        <TableHead>Children Details</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredParents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No parents match your search query.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredParents.map((parent) => (
                            <TableRow key={parent.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span>{parent.full_name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> {parent.email}
                                    </span>
                                    {parent.phone_number && (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" /> {parent.phone_number}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {parent.students && parent.students.length > 0 ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 w-full max-w-[200px] justify-between font-normal text-muted-foreground">
                                                <span>
                                                    <GraduationCap className="mr-2 h-4 w-4 inline-block text-emerald-600" />
                                                    {parent.students.length} {parent.students.length === 1 ? 'Student' : 'Students'}
                                                </span>
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-[280px]">
                                            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Enrolled Children
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                                {parent.students.map((student: { id: string; full_name: string; roll_number: string; classes: unknown }) => {
                                                    const classInfo = Array.isArray(student.classes) ? student.classes[0] : student.classes as { name: string, section: string };
                                                    return (
                                                        <DropdownMenuItem key={student.id} className="flex-col items-start gap-1 py-2 focus:bg-accent/50 cursor-default">
                                                            <div className="flex items-center gap-2 w-full">
                                                                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                <span className="font-medium text-sm truncate">{student.full_name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-5 text-xs text-muted-foreground w-full">
                                                                <span className="truncate">#{student.roll_number}</span>
                                                                {classInfo && (
                                                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase border">
                                                                        {classInfo.name}-{classInfo.section}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic pl-2">None</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20 uppercase tracking-widest">
                                    Parent
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <SingleReminderButton parentId={parent.id} />
                                    <EditParentDialog parent={parent} />

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Parent Account</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete <strong>{parent.full_name}</strong>? This action cannot be undone and will remove their access to the portal.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        deleteMutation.mutate(parent.id);
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
        </div>
    );
}

