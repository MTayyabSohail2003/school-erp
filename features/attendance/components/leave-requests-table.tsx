'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getLeaveRequests, updateLeaveRequestStatus, LeaveRequestStatus } from '@/features/attendance/actions/leave-actions';
import { useRealtimeInvalidation } from '@/hooks/use-realtime-invalidation';

interface LeaveRequestsTableProps {
    userRole: string; // 'ADMIN' | 'TEACHER' | 'PARENT'
}

export function LeaveRequestsTable({ userRole }: LeaveRequestsTableProps) {
    useRealtimeInvalidation('leave_requests', ['leave-requests']);
    const queryClient = useQueryClient();
    const canManage = userRole === 'ADMIN' || userRole === 'TEACHER';

    const { data: requests, isLoading, error } = useQuery({
        queryKey: ['leave-requests'],
        queryFn: async () => {
            const res = await getLeaveRequests();
            if (res.error) throw new Error(res.error);
            return res.data || [];
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: LeaveRequestStatus }) => {
            const res = await updateLeaveRequestStatus(id, status);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            toast.success('Leave status updated');
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to update status');
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading leave requests...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center py-10 text-destructive">
                <AlertCircle className="w-5 h-5 mr-2" />
                Failed to load leave requests.
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                No leave requests found.
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Pending</Badge>;
        }
    };

    return (
        <div className="border rounded-md overflow-hidden bg-background shadow-sm">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Leave Dates</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{req.student?.full_name || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">{req.student?.roll_number}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {req.student?.class ? `${req.student.class.name}-${req.student.class.section}` : '-'}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-sm">
                                    <span>From: {format(new Date(req.start_date), 'MMM d, yyyy')}</span>
                                    <span>To: {format(new Date(req.end_date), 'MMM d, yyyy')}</span>
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={req.reason}>
                                {req.reason}
                                <div className="text-xs text-muted-foreground mt-1">By: {req.applicant?.full_name}</div>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(req.status)}
                            </TableCell>

                            {canManage && (
                                <TableCell className="text-right space-x-2">
                                    {req.status === 'PENDING' ? (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-8 px-2"
                                                onClick={() => statusMutation.mutate({ id: req.id, status: 'APPROVED' })}
                                                disabled={statusMutation.isPending}
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-2"
                                                onClick={() => statusMutation.mutate({ id: req.id, status: 'REJECTED' })}
                                                disabled={statusMutation.isPending}
                                            >
                                                <X className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Actioned</span>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
