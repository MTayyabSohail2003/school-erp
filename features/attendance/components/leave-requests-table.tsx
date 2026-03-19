'use client';

import { useState, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Check, X, Loader2, AlertCircle, CalendarIcon, ClipboardList, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getLeaveRequests, updateLeaveRequestStatus, deleteLeaveRequest, type LeaveRequestStatus } from '@/features/attendance/actions/leave-actions';
import { postTodayLeaveSummary } from '@/features/notices/actions/post-leave-summary.action';
import { useRealtimeInvalidation } from '@/hooks/use-realtime-invalidation';

interface LeaveRequestsTableProps {
    userRole: string;
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

export function LeaveRequestsTable({ userRole }: LeaveRequestsTableProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [isPosting, startPosting] = useTransition();

    const canManage = userRole === 'ADMIN';

    // Build the ISO date string for filtering (YYYY-MM-DD)
    const dateFilter = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;

    useRealtimeInvalidation('leave_requests', ['leave-requests', dateFilter]);

    const queryClient = useQueryClient();

    const { data: requests, isLoading, error } = useQuery({
        queryKey: ['leave-requests', dateFilter],
        queryFn: async () => {
            const res = await getLeaveRequests(dateFilter);
            if (res.error) throw new Error(res.error);
            return res.data || [];
        },
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: LeaveRequestStatus }) => {
            const res = await updateLeaveRequestStatus(id, status);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            toast.success('Leave status updated');
            queryClient.invalidateQueries({ queryKey: ['leave-requests', dateFilter] });
        },
        onError: (err) => toast.error(err.message || 'Failed to update status'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteLeaveRequest(id);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            toast.success('Leave request deleted');
            queryClient.invalidateQueries({ queryKey: ['leave-requests', dateFilter] });
        },
        onError: (err) => toast.error(err.message || 'Failed to delete request'),
    });

    const handlePostToNoticeBoard = () => {
        startPosting(async () => {
            const result = await postTodayLeaveSummary(dateFilter);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success(`📋 Leave summary posted to Teacher Notice Board! (${result.count} request${result.count === 1 ? '' : 's'})`);
            }
        });
    };

    const hasProcessed = requests?.some(r => r.status !== 'PENDING');

    return (
        <div className="space-y-4">
            {/* Toolbar: date picker + post button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Date Picker */}
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        className="h-10 w-[180px] bg-background"
                        value={dateFilter || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const val = e.target.value;
                            setSelectedDate(val ? new Date(val) : undefined);
                        }}
                    />
                    {selectedDate && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground text-xs"
                            onClick={() => setSelectedDate(undefined)}
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {/* Post to Notice Board (admin only, only when there are processed requests) */}
                {canManage && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 shrink-0"
                        onClick={handlePostToNoticeBoard}
                        disabled={isPosting || !hasProcessed}
                        title={!hasProcessed ? 'No approved/rejected requests to post' : 'Post summary to teacher notice board'}
                    >
                        {isPosting
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <ClipboardList className="h-4 w-4" />}
                        Post to Notice Board
                    </Button>
                )}
            </div>

            {/* Date context banner */}
            {selectedDate ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                    <CalendarIcon className="h-3 w-3" />
                    Showing leave requests from <strong>{format(selectedDate, 'MMMM d, yyyy')}</strong>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                    <CalendarIcon className="h-3 w-3" />
                    Showing all leave requests. Select a date above to filter.
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center items-center py-10 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading leave requests...
                </div>
            ) : error ? (
                <div className="flex justify-center items-center py-10 text-destructive">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Failed to load leave requests.
                </div>
            ) : !requests || requests.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    {selectedDate
                        ? `No leave requests found for ${format(selectedDate, 'MMMM d, yyyy')}.`
                        : 'No leave requests found.'}
                </div>
            ) : (
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
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === 'PENDING' && (
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
                                                )}
                                                
                                                {/* Always show delete for admins */}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Leave Request?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently remove this leave request for {req.student?.full_name}. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                onClick={() => deleteMutation.mutate(req.id)}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
