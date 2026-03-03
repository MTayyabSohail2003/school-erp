'use client';

import { useClasses } from '@/features/classes/hooks/use-classes';
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
import { AlertCircle } from 'lucide-react';

export function ClassesTable() {
    const { data: classes, isLoading, isError, error } = useClasses();

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
                        <TableHead className="text-right">System ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classes.map((cls) => (
                        <TableRow key={cls.id}>
                            <TableCell className="font-medium text-base">{cls.name}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">{cls.section}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs font-mono">
                                {cls.id.split('-')[0]}...
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
