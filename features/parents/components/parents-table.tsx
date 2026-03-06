'use client';


import { useGetParents } from '@/features/parents/api/use-get-parents';
import { useRealtimeInvalidation } from '@/hooks/use-realtime-invalidation';
import { EditParentDialog } from '@/features/parents/components/edit-parent-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Mail, Phone, User, Loader2, AlertCircle } from 'lucide-react';

export function ParentsTable() {
    // 1. Listen for real-time changes to the users table specifically pointing to parents
    useRealtimeInvalidation('users', ['parents'], "role=eq.PARENT");

    const { data: parents, isLoading, error } = useGetParents();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10 text-muted-foreground border rounded-md bg-white">
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

    if (!parents || parents.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <h3 className="text-sm font-medium">No parents found</h3>
                <p className="text-xs mt-1">Add a new parent using the button above.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-md overflow-hidden bg-background shadow-sm">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Contact Information</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {parents.map((parent) => (
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
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 uppercase tracking-widest">
                                    Parent
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <EditParentDialog parent={parent} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

