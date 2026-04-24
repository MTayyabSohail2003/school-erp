'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Briefcase,
    Save,
    Loader2,
    Search,
    User,
    CheckSquare,
    Printer
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

import { useGetStaffAttendance } from '../api/use-get-staff-attendance';
import { useUpsertStaffAttendance } from '../api/use-upsert-staff-attendance';
import { type AttendanceStatus } from '../schemas/attendance.schema';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useGetStaff } from '@/features/staff/api/use-get-staff';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

// Status styling config (Matches student attendance)
const STATUS_CONFIG: Record<AttendanceStatus, { label: string; className: string }> = {
    PRESENT: {
        label: 'Present',
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
    },
    ABSENT: {
        label: 'Absent',
        className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/25',
    },
    LEAVE: {
        label: 'Leave',
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
    },
};

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
            console.log('[Attendance Debug] Raw DB Records:', attendanceData);
            const map: Record<string, AttendanceStatus> = {};
            attendanceData.forEach((rec) => {
                if (rec.user_id) {
                    map[rec.user_id] = rec.status;
                }
            });
            console.log('[Attendance Debug] Computed Status Map:', map);
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
            toast.error('No staff attendance marked yet.');
            return;
        }

        const promise = upsertMutation.mutateAsync(records);

        toast.promise(promise, {
            loading: 'Saving attendance records...',
            success: 'Staff attendance saved successfully!',
            error: (err) => `Failed to save: ${err.message}`,
        });
    };

    // Deduplicate staff list by ID to prevent "Double Row" UI glitches
    const staffMembers = (staffList ?? []).reduce((acc: any[], current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) return acc.concat([current]);
        return acc;
    }, []);

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
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Attendance</h1>
                            <p className="text-sm text-muted-foreground">Manage attendance for teachers and staff</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={upsertMutation.isPending || staffMembers.length === 0}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-500/20"
                    >
                        {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Staff Attendance
                    </Button>
                </div>

                {/* ── Filters ── */}
                <Card className="border-none shadow-sm bg-muted/20">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col sm:flex-row gap-4 max-w-sm">
                            <div className="flex-1 space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">
                                    Attendance Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full h-12 justify-start text-left font-bold rounded-xl border-2 border-primary/10 bg-background/50 hover:border-primary/30 transition-all",
                                                !selectedDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                                            {selectedDate ? format(parseISO(selectedDate), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-2 border-primary/10 shadow-2xl" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={isValid(parseISO(selectedDate)) ? parseISO(selectedDate) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setSelectedDate(format(date, 'yyyy-MM-dd'));
                                                    setStatusMap({});
                                                }
                                            }}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            className="p-3"
                                        />
                                    </PopoverContent>
                                </Popover>
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
                <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-md">
                    <CardHeader className="border-b  pb-4">
                        <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            {staffMembers.length} Staff Members
                        </CardTitle>
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
                                        <motion.div
                                            key={staff.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/10 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <ImagePreviewDialog
                                                    src={staff.avatar_url}
                                                    title={staff.full_name}
                                                    description={`Role: ${staff.role || 'Staff'}`}
                                                >
                                                    <Avatar className="h-12 w-12 border-2 border-primary/10 transition-all group-hover:scale-105 group-hover:border-primary/30 shrink-0 cursor-zoom-in">
                                                        {staff.avatar_url ? (
                                                            <AvatarImage src={staff.avatar_url} className="object-cover" />
                                                        ) : null}
                                                        <AvatarFallback className="bg-primary/5 text-primary font-black text-xs text-center">
                                                            {staff.full_name.substring(0, 2).toUpperCase() || <User className="w-5 h-5" />}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </ImagePreviewDialog>

                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black tracking-tight text-foreground/90 truncate">
                                                        {staff.full_name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest py-0 px-1.5 h-4 border-primary/20 text-primary/70">
                                                            {staff.role || 'Teacher'}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 truncate">
                                                            {staff.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => staff.id && setStatus(staff.id, status)}
                                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200 cursor-pointer active:scale-95 ${currentStatus === status
                                                                ? STATUS_CONFIG[status].className + " shadow-lg shadow-primary/5"
                                                                : 'border-border/60 text-muted-foreground hover:border-primary/20 hover:bg-primary/5'
                                                            }`}
                                                    >
                                                        {STATUS_CONFIG[status].label}
                                                    </button>
                                                ))}
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
