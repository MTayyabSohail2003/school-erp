'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Briefcase, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { useGetStaffAttendance } from '../api/use-get-staff-attendance';
import { useUpsertStaffAttendance } from '../api/use-upsert-staff-attendance';
import { type AttendanceStatus } from '../schemas/attendance.schema';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useGetStaff } from '@/features/staff/api/use-get-staff';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';

export function StaffAttendanceView() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState(today);

    const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});

    const { data: staffList, isLoading: staffLoading } = useGetStaff();
    const { data: attendanceData, isLoading: attendanceLoading } = useGetStaffAttendance(selectedDate);
    const upsertMutation = useUpsertStaffAttendance(selectedDate);
    const { data: profile } = useAuthProfile();

    useEffect(() => {
        if (attendanceData) {
            const map: Record<string, AttendanceStatus> = {};
            attendanceData.forEach((rec) => { map[rec.user_id] = rec.status; });
            setStatusMap(map);
        }
    }, [attendanceData, selectedDate]);

    const setStatus = (userId: string, status: AttendanceStatus) => {
        setStatusMap((prev) => ({ ...prev, [userId]: status }));
    };

    const handleSave = () => {
        if (!selectedDate) return;

        const records = Object.entries(statusMap).map(([userId, status]) => ({
            user_id: userId,
            record_date: selectedDate,
            status,
            marked_by: profile?.id,
        }));

        if (records.length === 0) {
            toast.error('No attendance marked yet.');
            return;
        }

        upsertMutation.mutate(records, {
            onSuccess: () => toast.success('Staff attendance saved!'),
            onError: (err) => toast.error(err.message),
        });
    };

    const staffMembers = staffList ?? [];
    const presentCount = Object.values(statusMap).filter((s) => s === 'PRESENT').length;
    const absentCount = Object.values(statusMap).filter((s) => s === 'ABSENT').length;
    const leaveCount = Object.values(statusMap).filter((s) => s === 'LEAVE').length;
    const unmarkedCount = staffMembers.length - Object.keys(statusMap).length;

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Staff Attendance</h1>
                            <p className="text-sm text-muted-foreground">Manage attendance for teachers and staff</p>
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={upsertMutation.isPending || staffMembers.length === 0} className="gap-2">
                        {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Staff Attendance
                    </Button>
                </div>

                {/* ── Filters ── */}
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex flex-col sm:flex-row gap-4 max-w-sm">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
                                <Input type="date" value={selectedDate} max={today} onChange={(e) => { setSelectedDate(e.target.value); setStatusMap({}); }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Summary Bar ── */}
                {staffMembers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Present', count: presentCount, color: 'text-emerald-500' },
                            { label: 'Absent', count: absentCount, color: 'text-red-500' },
                            { label: 'Leave', count: leaveCount, color: 'text-amber-500' },
                            { label: 'Unmarked', count: unmarkedCount, color: 'text-muted-foreground' },
                        ].map(({ label, count, color }) => (
                            <Card key={label} className="text-center py-3 px-4">
                                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                            </Card>
                        ))}
                    </motion.div>
                )}

                {/* ── Staff Grid ── */}
                <Card>
                    <CardHeader className="border-b pb-3">
                        <CardTitle className="text-base font-semibold">{staffMembers.length} Staff Members</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(staffLoading || attendanceLoading) && (
                            <div className="divide-y divide-border">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between px-5 py-3.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-8 w-64" /></div>
                                ))}
                            </div>
                        )}

                        {!staffLoading && !attendanceLoading && (
                            <div className="divide-y divide-border">
                                {staffMembers.length === 0 && <p className="text-center text-muted-foreground py-16 text-sm">No staff registered.</p>}
                                {staffMembers.map((staff, index) => {
                                    const currentStatus = staff.id ? statusMap[staff.id] ?? null : null;
                                    return (
                                        <motion.div key={staff.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-sm font-medium truncate">{staff.full_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => staff.id && setStatus(staff.id, 'PRESENT')}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${currentStatus === 'PRESENT' ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/40 dark:border-green-800' : 'bg-transparent border-input hover:bg-muted'}`}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    onClick={() => staff.id && setStatus(staff.id, 'ABSENT')}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${currentStatus === 'ABSENT' ? 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-800' : 'bg-transparent border-input hover:bg-muted'}`}
                                                >
                                                    A
                                                </button>
                                                <button
                                                    onClick={() => staff.id && setStatus(staff.id, 'LEAVE')}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${currentStatus === 'LEAVE' ? 'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/40 dark:border-yellow-800' : 'bg-transparent border-input hover:bg-muted'}`}
                                                >
                                                    L
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    );
}
