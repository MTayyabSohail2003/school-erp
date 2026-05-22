'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    CalendarDays,
    Save,
    Loader2,
    Search,
    Users,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Printer,
    User,
    History,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

import { useTeacherClasses } from '@/features/classes/hooks/use-teacher-classes';
import { useGetAttendance } from '../api/use-get-attendance';
import { useUpsertAttendance } from '../api/use-upsert-attendance';
import { type AttendanceStatus } from '../schemas/attendance.schema';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useStudentsByClass, type StudentBasic } from '@/features/students/hooks/use-students-by-class';
import { AttendancePrintReport } from './attendance-print-report';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

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
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Initialize from URL or default
    const [selectedClassId, setSelectedClassId] = useState(searchParams.get('classId') || '');
    const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || today);

    // Map of student_id → status (local state before save)
    const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});

    // Historical mode: read-only view including promoted students
    const [isHistoricalMode, setIsHistoricalMode] = useState(false);

    // Pagination & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isPrinting, setIsPrinting] = useState(false);
    const PAGE_SIZE = 10;

    const { data: classes, isLoading: classesLoading } = useTeacherClasses();
    const { data: attendanceData, isLoading: attendanceLoading } = useGetAttendance(selectedClassId, selectedDate);
    const upsertMutation = useUpsertAttendance(selectedClassId, selectedDate);
    const { data: profile } = useAuthProfile();

    // Update URL when class or date changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedClassId) params.set('classId', selectedClassId);
        if (selectedDate) params.set('date', selectedDate);
        
        const query = params.toString();
        const url = query ? `${pathname}?${query}` : pathname;
        
        router.push(url, { scroll: false });
    }, [selectedClassId, selectedDate, pathname, router, searchParams]);

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

    // Reset states when class or date changes
    const handleClassOrDateChange = () => {
        setStatusMap({});
        setCurrentPage(1);
        setSearchTerm('');
    };

    const setStatus = (studentId: string, status: AttendanceStatus) => {
        setStatusMap((prev) => ({ ...prev, [studentId]: status }));
    };

    const markAllPresent = () => {
        const newMap = { ...statusMap };
        filteredStudents.forEach(student => {
            if (!newMap[student.id]) {
                newMap[student.id] = 'PRESENT';
            }
        });
        setStatusMap(newMap);
        toast.info(`Marked ${filteredStudents.length} students as 'Present'`);
    };

    const handleSave = () => {
        if (!selectedClassId || !selectedDate) return;

        // Build a record for every student that has a status set
        const records = Object.entries(statusMap).map(([studentId, status]) => ({
            student_id: studentId,
            class_id: selectedClassId,
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
    const { data: allStudents } = useStudentsByClass(selectedClassId);

    // Historical mode: build student list from attendance records themselves
    const historicalStudents: StudentBasic[] = (attendanceData ?? []).map(rec => ({
        id: rec.student_id,
        full_name: rec.students?.full_name ?? 'Unknown',
        roll_number: rec.students?.roll_number ?? '—',
        photo_url: null,
    }));

    // Deduplicate by student_id (attendance may have duplicates across refreshes)
    const uniqueHistorical = Array.from(
        new Map(historicalStudents.map(s => [s.id, s])).values()
    );

    // Use historical students when in historical mode, otherwise active students
    const studentList = isHistoricalMode ? uniqueHistorical : (allStudents ?? []);

    const selectedClass = (classes ?? []).find(c => c.id === selectedClassId);
    const selectedClassName = selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : '';

    // Sorting, Filtering & Pagination Logic
    const filteredStudents = studentList
        .filter(s =>
            s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            return (a.roll_number || '').localeCompare(b.roll_number || '', undefined, { numeric: true, sensitivity: 'base' });
        });

    const totalResults = filteredStudents.length;
    const totalPages = Math.ceil(totalResults / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalResults);
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

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

                    <div className="flex items-center gap-3">
                        {selectedClassId && studentList.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setIsPrinting(true)}
                                className="gap-2 border-primary/20 hover:bg-primary/5 font-bold"
                            >
                                <Printer className="h-4 w-4" />
                                Print Report
                            </Button>
                        )}
                        {canMark && !isHistoricalMode && (
                            <Button
                                onClick={handleSave}
                                disabled={upsertMutation.isPending || studentList.length === 0}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-500/20"
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
                </div>

                {/* ── Filters ── */}
                <Card className="border-none shadow-sm bg-muted/20">
                    <CardContent className="pt-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Class Selection */}
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">
                                    Target Class
                                </Label>
                                <Select
                                    value={selectedClassId}
                                    onValueChange={(v) => { setSelectedClassId(v); handleClassOrDateChange(); }}
                                    disabled={classesLoading}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-2 border-primary/10 bg-background/50 hover:border-primary/30 transition-all font-bold">
                                        <div className="flex items-center gap-3">
                                            <Users className="h-4 w-4 text-primary" />
                                            <SelectValue placeholder="Select a class…" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-2 border-primary/10">
                                        {(classes ?? []).map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id} className="font-bold py-3 hover:bg-primary/5 cursor-pointer">
                                                {cls.name} — Section {cls.section}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Selection + Historical Toggle */}
                            <div className="space-y-2.5">
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
                                                    handleClassOrDateChange();
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
                            {/* Historical Mode Toggle */}
                            {selectedClassId && (
                                <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2 border-t border-border/30">
                                    <div className="flex items-center gap-3">
                                        <History className="h-4 w-4 text-amber-500" />
                                        <div>
                                            <p className="text-xs font-bold text-foreground">View Historical Records</p>
                                            <p className="text-[10px] text-muted-foreground">Include promoted/graduated students (read-only)</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={isHistoricalMode ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setIsHistoricalMode(prev => !prev)}
                                        className={cn(
                                            'rounded-xl px-4 text-[10px] font-black uppercase tracking-widest gap-2 transition-all',
                                            isHistoricalMode && 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                        )}
                                    >
                                        <History className="w-3.5 h-3.5" />
                                        {isHistoricalMode ? 'Historical ON' : 'Off'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Historical Mode Banner */}
                {isHistoricalMode && selectedClassId && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                        <History className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-bold">
                            Historical Mode — Showing all students who had attendance in this class on this date, including promoted/graduated. Editing is disabled.
                        </p>
                    </div>
                )}

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
                <Card className="overflow-hidden border-none  shadow-xl bg-card/50 backdrop-blur-md">
                    <CardHeader className="border-b pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                {selectedClassId
                                    ? `${totalResults} Students Found`
                                    : 'Students List'}
                            </CardTitle>

                            {selectedClassId && canMark && (
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or roll..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                            className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all rounded-xl h-9 text-xs"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={markAllPresent}
                                        disabled={filteredStudents.length === 0}
                                        className="h-9 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest gap-2"
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        Mark All Present
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!selectedClassId && (
                            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                    <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground/80">Select Class & Date</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                    Choose a class from the dropdown above to manage daily attendance records.
                                </p>
                            </div>
                        )}

                        {selectedClassId && attendanceLoading && (
                            <div className="divide-y divide-border/50">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-64 rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedClassId && !attendanceLoading && (
                            <div className="divide-y divide-border/50 min-h-[400px]">
                                {paginatedStudents.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                                        <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            No students found matching "{searchTerm}"
                                        </p>
                                    </div>
                                )}
                                {paginatedStudents.map((student, index) => {
                                    const currentStatus = statusMap[student.id] ?? null;
                                    return (
                                        <motion.div
                                            key={student.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/10 transition-colors group"
                                        >
                                            {/* Student info */}
                                            <div className="flex items-center gap-4 min-w-0">
                                                <ImagePreviewDialog
                                                    src={student.photo_url}
                                                    title={student.full_name}
                                                    description={`Roll No: ${student.roll_number}`}
                                                >
                                                    <Avatar className="h-12 w-12 border-2 border-primary/10 transition-all group-hover:scale-105 group-hover:border-primary/30 shrink-0 cursor-zoom-in">
                                                        {student.photo_url ? (
                                                            <AvatarImage src={student.photo_url} className="object-cover" />
                                                        ) : null}
                                                        <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                                                            {student.full_name.charAt(0) || <User className="w-5 h-5" />}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </ImagePreviewDialog>

                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black tracking-tight text-foreground/90 truncate">
                                                        {student.full_name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest py-0 px-1.5 h-4 border-primary/20 text-primary/70">
                                                            {selectedClassName}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                                            {student.roll_number}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status toggles */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => canMark && setStatus(student.id, status)}
                                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200 ${canMark ? 'cursor-pointer active:scale-95' : 'cursor-default'} ${currentStatus === status
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

                        {/* Pagination Footer - Industry Level */}
                        {selectedClassId && totalPages > 1 && (
                            <div className="bg-muted/10 px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                        Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{endIndex}</span> of <span className="text-foreground">{totalResults}</span> active records
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center gap-1.5 mx-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                            .map((p, idx, array) => {
                                                const showEllipsis = idx > 0 && p !== array[idx - 1] + 1;
                                                return (
                                                    <div key={p} className="flex items-center gap-1.5">
                                                        {showEllipsis && <span className="text-muted-foreground/30 text-xs font-bold px-1">...</span>}
                                                        <Button
                                                            variant={currentPage === p ? 'default' : 'ghost'}
                                                            size="sm"
                                                            className={cn(
                                                                "h-9 w-9 p-0 rounded-xl font-black text-xs transition-all duration-300",
                                                                currentPage === p
                                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 pointer-events-none"
                                                                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                                            )}
                                                            onClick={() => setCurrentPage(p)}
                                                        >
                                                            {p}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {isPrinting && (
                    <AttendancePrintReport
                        open={isPrinting}
                        data={studentList.map(s => ({
                            ...s,
                            status: statusMap[s.id] || 'UNMARKED'
                        }))}
                        onClose={() => setIsPrinting(false)}
                        filters={{
                            className: classes?.find(c => c.id === selectedClassId)?.name || '',
                            section: classes?.find(c => c.id === selectedClassId)?.section || '',
                            date: selectedDate
                        }}
                    />
                )}
            </div>
        </PageTransition>
    );
}
