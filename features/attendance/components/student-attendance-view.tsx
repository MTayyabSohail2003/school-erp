'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CalendarDays, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { useTeacherClasses } from '@/features/classes/hooks/use-teacher-classes';
import { useGetAttendance } from '../api/use-get-attendance';
import { useUpsertAttendance } from '../api/use-upsert-attendance';
import { type AttendanceStatus } from '../schemas/attendance.schema';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useStudentsByClass } from '@/features/students/hooks/use-students-by-class';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';

// Status styling config
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

export function StudentAttendanceView() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(today);

    // Map of student_id → status (local state before save)
    const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});

    const { data: classes, isLoading: classesLoading } = useTeacherClasses();
    const { data: attendanceData, isLoading: attendanceLoading } = useGetAttendance(selectedClassId, selectedDate);
    const upsertMutation = useUpsertAttendance(selectedClassId, selectedDate);
    const { data: profile } = useAuthProfile();

    // Initialize the statusMap from attendance DB records
    const initializeStatusMap = (data: typeof attendanceData) => {
        if (!data) return;
        const map: Record<string, AttendanceStatus> = {};
        data.forEach((rec) => { map[rec.student_id] = rec.status; });
        setStatusMap(map);
    };

    // When attendance data loads or changes, sync it to local statusMap
    useEffect(() => {
        if (attendanceData) initializeStatusMap(attendanceData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendanceData]);

    // Reset statusMap when class or date changes
    const handleClassOrDateChange = () => {
        setStatusMap({});
    };

    const setStatus = (studentId: string, status: AttendanceStatus) => {
        setStatusMap((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleSave = () => {
        if (!selectedClassId || !selectedDate) return;

        // Build a record for every student that has a status set
        const records = Object.entries(statusMap).map(([studentId, status]) => ({
            student_id: studentId,
            record_date: selectedDate,
            status,
            marked_by: profile?.id,
        }));

        if (records.length === 0) {
            toast.error('No attendance marked yet. Toggle statuses first.');
            return;
        }

        upsertMutation.mutate(records, {
            onSuccess: () => toast.success('Attendance saved successfully!'),
            onError: (err) => toast.error(err.message),
        });
    };

    // Derive the students list from attendanceData OR from selected class students
    // We always need a student list. If attendance was never marked, attendanceData is empty.
    // So we need to fetch the raw students list too.
    const { data: allStudents } = useStudentsByClass(selectedClassId);

    const studentList = allStudents ?? [];
    const presentCount = Object.values(statusMap).filter((s) => s === 'PRESENT').length;
    const absentCount = Object.values(statusMap).filter((s) => s === 'ABSENT').length;
    const leaveCount = Object.values(statusMap).filter((s) => s === 'LEAVE').length;
    const unmarkedCount = studentList.length - Object.keys(statusMap).length;

    const isTeacher = profile?.role === 'TEACHER';
    const isAdmin = profile?.role === 'ADMIN';
    const canMark = isTeacher || isAdmin;

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Daily Attendance</h1>
                            <p className="text-sm text-muted-foreground">
                                {canMark ? 'Mark attendance for students' : 'Overview of student attendance'}
                            </p>
                        </div>
                    </div>

                    {canMark && (
                        <Button
                            onClick={handleSave}
                            disabled={upsertMutation.isPending || studentList.length === 0}
                            className="gap-2"
                        >
                            {upsertMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Attendance
                        </Button>
                    )}
                </div>

                {/* ── Filters ── */}
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Class
                                </Label>
                                <Select
                                    value={selectedClassId}
                                    onValueChange={(v) => { setSelectedClassId(v); handleClassOrDateChange(); }}
                                    disabled={classesLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a class…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(classes ?? []).map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name} — Section {cls.section}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Date
                                </Label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    max={today}
                                    onChange={(e) => { setSelectedDate(e.target.value); handleClassOrDateChange(); }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Summary Bar ── */}
                {selectedClassId && studentList.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                    >
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

                {/* ── Student Grid ── */}
                <Card>
                    <CardHeader className="border-b pb-3">
                        <CardTitle className="text-base font-semibold">
                            {selectedClassId
                                ? `${studentList.length} Students`
                                : 'Select a class to view students'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!selectedClassId && (
                            <p className="text-center text-muted-foreground py-16 text-sm">
                                Select a class and date above to begin marking attendance.
                            </p>
                        )}

                        {selectedClassId && attendanceLoading && (
                            <div className="divide-y divide-border">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between px-5 py-3.5">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-8 w-64" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedClassId && !attendanceLoading && (
                            <div className="divide-y divide-border">
                                {studentList.length === 0 && (
                                    <p className="text-center text-muted-foreground py-16 text-sm">
                                        No students enrolled in this class yet.
                                    </p>
                                )}
                                {studentList.map((student, index) => {
                                    const currentStatus = statusMap[student.id] ?? null;
                                    return (
                                        <motion.div
                                            key={student.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                                        >
                                            {/* Student info */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                {student.photo_url ? (
                                                    <img
                                                        src={student.photo_url}
                                                        alt={student.full_name}
                                                        className="h-10 w-10 rounded-full object-cover shrink-0 border-2 border-primary/10 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-black ring-2 ring-primary/5">
                                                        {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold truncate text-foreground/90">{student.full_name}</span>
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">Roll: {student.roll_number}</span>
                                                </div>
                                            </div>

                                            {/* Status toggles */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => canMark && setStatus(student.id, status)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${canMark ? 'cursor-pointer' : 'cursor-default'} ${currentStatus === status
                                                            ? STATUS_CONFIG[status].className
                                                            : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40'
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
