'use client';

import { useState } from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useGetStaff } from '../api/use-get-staff';
import { useDeleteStaff } from '../api/use-delete-staff';
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
import { EditStaffDialog } from './edit-staff-dialog';

export function StaffTable() {
    const { data: staff, isLoading } = useGetStaff();
    const deleteMutation = useDeleteStaff();

    // State for the edit dialog
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    // State for the delete confirmation dialog
    const [staffToDelete, setStaffToDelete] = useState<{ id: string; name: string } | null>(null);

    const confirmDelete = () => {
        if (!staffToDelete) return;
        const loadingToast = toast.loading('Deleting staff member...');
        deleteMutation.mutate(staffToDelete.id, {
            onSuccess: () => {
                toast.success('Staff member deleted.', { id: loadingToast });
                setStaffToDelete(null);
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to delete staff member.', { id: loadingToast });
                setStaffToDelete(null);
            },
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Staff Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!staff || staff.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Staff Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <p>No staff records found. Add a teacher to get started.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Staff Records</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        {/* Table Header and Body below */}
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Qualification</TableHead>
                                <TableHead className="text-right">Monthly Salary</TableHead>
                                <TableHead className="w-[100px] text-right">Role</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.full_name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.phone_number || '-'}</TableCell>
                                    <TableCell>{member.qualification}</TableCell>
                                    <TableCell className="text-right">
                                        ${member.monthly_salary.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="secondary">Teacher</Badge>
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
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedStaff(member);
                                                    setIsEditOpen(true);
                                                }}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => setStaffToDelete({ id: member.id || '', name: member.full_name })}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Staff
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Modals outside the table logic */}
                <EditStaffDialog
                    isOpen={isEditOpen}
                    setIsOpen={setIsEditOpen}
                    staffMember={selectedStaff}
                />

                <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the staff account and profile for <strong>{staffToDelete?.name}</strong>. Their login access will also be removed. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    confirmDelete();
                                }}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete Staff'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
