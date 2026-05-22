'use client';

import { useState, useMemo, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import {
    ArrowRight,
    GraduationCap,
    TrendingUp,
    CalendarDays,
    Wallet,
    ClipboardList,
    ChevronDown,
    ChevronUp,
    UserPlus,
    CheckCircle,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

import { usePromotionHistory, useStudentEnrollment, useAttendanceHistory, useFeeHistory } from '../hooks/use-student-history';
import { useGetAllResultsByStudent } from '@/features/results/hooks/use-results';
import type { PromotionHistoryEntry, AttendanceHistoryMonth, FeeHistoryEntry } from '../api/student-history.api';

type StudentHistoryProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    rollNumber: string;
    photoUrl?: string | null;
    currentStatus?: string;
    currentClass?: string;
};

export function StudentHistoryDialog({
    open,
    onOpenChange,
    studentId,
    studentName,
    rollNumber,
    photoUrl,
    currentStatus,
    currentClass,
}: StudentHistoryProps) {
    const [activeTab, setActiveTab] = useState('timeline');
    const queryClient = useQueryClient();
    const [isRefreshing, startTransition] = useTransition();

    const handleRefresh = () => {
        startTransition(async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['student-history'] }),
                queryClient.invalidateQueries({ queryKey: ['results', 'all-student-results', studentId] })
            ]);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-none !w-screen !h-screen !max-h-screen !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 p-0 gap-0 overflow-hidden rounded-none border-none flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/10">
                    <div className="flex items-center gap-4">
                        <ImagePreviewDialog src={photoUrl} title={studentName} description={`Roll: ${rollNumber}`}>
                            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-md cursor-pointer hover:scale-105 transition-transform">
                                <AvatarImage src={photoUrl ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                                    {studentName?.slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        </ImagePreviewDialog>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight">{studentName}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="font-mono text-xs rounded-lg">{rollNumber}</Badge>
                                {currentStatus && (
                                    <Badge className={cn(
                                        "rounded-lg text-[10px] font-black uppercase tracking-widest border-none",
                                        currentStatus === 'ACTIVE' && "bg-emerald-500/10 text-emerald-600",
                                        currentStatus === 'GRADUATED' && "bg-indigo-500/10 text-indigo-600",
                                    )}>
                                        {currentStatus}
                                    </Badge>
                                )}
                                {currentClass && (
                                    <Badge variant="outline" className="text-[10px] font-bold rounded-lg">{currentClass}</Badge>
                                )}
                            </DialogDescription>
                        </div>
                        <div className="ml-auto flex items-center">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="h-9 gap-2 text-xs font-bold"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                                {isRefreshing ? "Refetching..." : "Reload Data"}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
                    <div className="px-6 pt-3 border-b">
                        <TabsList className="bg-transparent h-auto p-0 gap-6">
                            {[
                                { value: 'timeline', label: 'Timeline', icon: TrendingUp },
                                { value: 'attendance', label: 'Attendance', icon: CalendarDays },
                                { value: 'fees', label: 'Fee Ledger', icon: Wallet },
                                { value: 'results', label: 'Results', icon: ClipboardList },
                            ].map(tab => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 pt-1 font-bold text-xs uppercase tracking-widest gap-1.5"
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="p-6">
                            <TabsContent value="timeline" className="mt-0">
                                <PromotionTimelineTab studentId={studentId} />
                            </TabsContent>
                            <TabsContent value="attendance" className="mt-0">
                                <AttendanceHistoryTab studentId={studentId} />
                            </TabsContent>
                            <TabsContent value="fees" className="mt-0">
                                <FeeHistoryTab studentId={studentId} />
                            </TabsContent>
                            <TabsContent value="results" className="mt-0">
                                <ResultsHistoryTab studentId={studentId} />
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

// ── Tab 1: Full Student Journey Timeline ──
function PromotionTimelineTab({ studentId }: { studentId: string }) {
    const { data: promotions, isLoading: promoLoading } = usePromotionHistory(studentId);
    const { data: enrollment, isLoading: enrollLoading } = useStudentEnrollment(studentId);

    const isLoading = promoLoading || enrollLoading;
    if (isLoading) return <SkeletonCards count={3} />;

    // Build unified timeline events (oldest first for display)
    type TimelineEvent = {
        id: string;
        type: 'enrolled' | 'promoted' | 'graduated' | 'current';
        date: string;
        title: string;
        subtitle: string;
        badges: { label: string; style: string }[];
    };

    const events: TimelineEvent[] = [];

    // 1. Enrollment event (always present)
    if (enrollment) {
        // Try to infer original class: If promoted, use the FIRST promotion's from_class. Otherwise use current class.
        const sortedPromos = [...(promotions ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const firstPromo = sortedPromos.length > 0 ? sortedPromos[0] : null;
        
        let enrollClassName = '';
        if (firstPromo && firstPromo.from_class) {
            enrollClassName = `${firstPromo.from_class.name} ${firstPromo.from_class.section}`.trim();
        } else if (enrollment.classes) {
            enrollClassName = `${enrollment.classes.name} ${enrollment.classes.section}`.trim();
        }

        events.push({
            id: 'enrolled',
            type: 'enrolled',
            date: enrollment.created_at,
            title: 'Enrolled in School',
            subtitle: enrollClassName ? `Registered into ${enrollClassName}` : 'Registration recorded',
            badges: [
                ...(enrollClassName ? [{ label: enrollClassName, style: 'bg-blue-500/10 text-blue-600' }] : []),
                ...(enrollment.academic_year ? [{ label: `Session ${enrollment.academic_year}`, style: 'bg-muted text-muted-foreground' }] : []),
            ],
        });
    }

    // 2. Promotion events (reverse to oldest-first)
    const sortedPromos = [...(promotions ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let hasGraduationRecord = false;

    sortedPromos.forEach(entry => {
        const isGrad = entry.is_graduation;
        if (isGrad) hasGraduationRecord = true;
        
        events.push({
            id: entry.id,
            type: isGrad ? 'graduated' : 'promoted',
            date: entry.created_at,
            title: isGrad ? 'Graduated from School' : `Promoted to ${entry.to_class?.name ?? '—'} ${entry.to_class?.section ?? ''}`.trim(),
            subtitle: `${entry.from_class?.name ?? '—'} ${entry.from_class?.section ?? ''} → ${isGrad ? 'Graduated' : `${entry.to_class?.name ?? '—'} ${entry.to_class?.section ?? ''}`}`.trim(),
            badges: [
                { label: isGrad ? 'GRADUATED' : 'PROMOTED', style: isGrad ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600' },
                ...(entry.from_academic_year ? [{ label: `${entry.from_academic_year} → ${entry.to_academic_year ?? '—'}`, style: 'bg-muted text-muted-foreground' }] : []),
            ],
        });
    });

    // 3. Current status or Synthesized Graduation event
    if (enrollment) {
        if (enrollment.status === 'ACTIVE') {
            const currentClass = enrollment.classes;
            events.push({
                id: 'current',
                type: 'current',
                date: new Date().toISOString(),
                title: 'Currently Active',
                subtitle: currentClass ? `Studying in ${currentClass.name} ${currentClass.section}`.trim() : 'Currently enrolled',
                badges: [
                    ...(currentClass ? [{ label: `${currentClass.name} ${currentClass.section}`.trim(), style: 'bg-emerald-500/10 text-emerald-600' }] : []),
                    { label: 'ACTIVE', style: 'bg-emerald-500 text-white' },
                ],
            });
        } else if (enrollment.status === 'GRADUATED' && !hasGraduationRecord) {
            // Synthesize graduation event if they are marked graduated but wizard wasn't used
            events.push({
                id: 'synthesized_graduated',
                type: 'graduated',
                date: new Date().toISOString(), // We don't have the exact date, so we use now or hide it
                title: 'Graduated from School',
                subtitle: 'Student has completed their studies',
                badges: [
                    { label: 'GRADUATED', style: 'bg-indigo-500/10 text-indigo-600' }
                ],
            });
        }
    }

    if (events.length === 0) {
        return <EmptyState icon={TrendingUp} message="No timeline data available" />;
    }

    const iconMap = {
        enrolled: { icon: UserPlus, color: 'bg-blue-500/10 border-blue-500/30', iconColor: 'text-blue-600' },
        promoted: { icon: ArrowRight, color: 'bg-emerald-500/10 border-emerald-500/30', iconColor: 'text-emerald-600' },
        graduated: { icon: GraduationCap, color: 'bg-indigo-500/10 border-indigo-500/30', iconColor: 'text-indigo-600' },
        current: { icon: CheckCircle, color: 'bg-emerald-500/10 border-emerald-500/30', iconColor: 'text-emerald-600' },
    };

    return (
        <div className="relative space-y-0">
            <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />

            {events.map((event) => {
                const config = iconMap[event.type];
                const IconComp = config.icon;
                return (
                    <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                        <div className={cn(
                            "relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                            config.color
                        )}>
                            <IconComp className={cn("w-4 h-4", config.iconColor)} />
                        </div>
                        <Card className="flex-1 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-black text-sm">{event.title}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{event.subtitle}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                        {event.badges.map(b => (
                                            <Badge key={b.label} className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest border-none shrink-0", b.style)}>
                                                {b.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                    <CalendarDays className="w-3 h-3" />
                                    <span>{format(new Date(event.date), 'dd MMM yyyy')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}

// ── Tab 2: Attendance History ──
function AttendanceHistoryTab({ studentId }: { studentId: string }) {
    const { data, isLoading } = useAttendanceHistory(studentId);
    const { data: promotions } = usePromotionHistory(studentId);
    const { data: enrollment } = useStudentEnrollment(studentId);
    
    const [yearFilter, setYearFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All');
    const [classFilter, setClassFilter] = useState('All');

    const ALL_MONTHS = [
        { value: '01', label: 'January' }, { value: '02', label: 'February' },
        { value: '03', label: 'March' }, { value: '04', label: 'April' },
        { value: '05', label: 'May' }, { value: '06', label: 'June' },
        { value: '07', label: 'July' }, { value: '08', label: 'August' },
        { value: '09', label: 'September' }, { value: '10', label: 'October' },
        { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];

    const years = useMemo(() => Array.from(new Set(data?.map(m => m.month.substring(0, 4)) ?? [])).sort().reverse(), [data]);
    
    const classes = useMemo(() => {
        const classSet = new Set<string>();
        // 1. Classes from attendance data
        data?.forEach(m => classSet.add(`${m.className} ${m.classSection}`.trim()));
        
        // 2. Classes from promotion history
        promotions?.forEach(p => {
            if (p.from_class) classSet.add(`${p.from_class.name} ${p.from_class.section}`.trim());
            if (p.to_class) classSet.add(`${p.to_class.name} ${p.to_class.section}`.trim());
        });
        
        // 3. Current enrolled class
        if (enrollment?.classes) {
            classSet.add(`${enrollment.classes.name} ${enrollment.classes.section}`.trim());
        }
        
        return Array.from(classSet).filter(Boolean).sort();
    }, [data, promotions, enrollment]);

    const filtered = useMemo(() => {
        if (!data) return [];
        return data.filter(m => {
            if (yearFilter !== 'All' && !m.month.startsWith(yearFilter)) return false;
            if (monthFilter !== 'All' && !m.month.endsWith(`-${monthFilter}`)) return false;
            if (classFilter !== 'All' && `${m.className} ${m.classSection}` !== classFilter) return false;
            return true;
        });
    }, [data, yearFilter, monthFilter, classFilter]);

    if (isLoading) return <SkeletonCards count={4} />;
    if (!data || data.length === 0) return <EmptyState icon={CalendarDays} message="No attendance records found" />;

    const totals = filtered.reduce((acc, m) => ({
        present: acc.present + m.present, absent: acc.absent + m.absent,
        leave: acc.leave + m.leave, total: acc.total + m.total,
    }), { present: 0, absent: 0, leave: 0, total: 0 });
    const overallPct = totals.total > 0 ? ((totals.present + totals.leave) / totals.total) * 100 : 0;

    return (
        <div className="space-y-5">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-32 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Years" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="All">All Years</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-36 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Months" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="All">All Months</SelectItem>
                        {ALL_MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-36 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="All">All Classes</SelectItem>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {(yearFilter !== 'All' || monthFilter !== 'All' || classFilter !== 'All') && (
                    <Button variant="ghost" size="sm" onClick={() => { setYearFilter('All'); setMonthFilter('All'); setClassFilter('All'); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-9">Reset</Button>
                )}
                <Badge variant="outline" className="ml-auto text-[10px] font-bold">{filtered.length} months</Badge>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Present', value: totals.present, color: 'text-emerald-600' },
                    { label: 'Absent', value: totals.absent, color: 'text-red-500' },
                    { label: 'Leave', value: totals.leave, color: 'text-amber-500' },
                    { label: 'Overall', value: `${overallPct.toFixed(1)}%`, color: overallPct >= 80 ? 'text-emerald-600' : overallPct >= 60 ? 'text-amber-500' : 'text-red-500' },
                ].map(s => (
                    <Card key={s.label} className="text-center py-3">
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
                    </Card>
                ))}
            </div>

            {/* Monthly breakdown */}
            <div className="space-y-2">
                {filtered.map((m: AttendanceHistoryMonth) => (
                    <Card key={`${m.month}-${m.classId}`} className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-black">{format(new Date(m.month + '-01'), 'MMM yyyy')}</div>
                                    <Badge variant="outline" className="text-[9px] font-bold">{m.className} {m.classSection}</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-emerald-600 font-bold">{m.present}P</span>
                                        <span className="text-red-500 font-bold">{m.absent}A</span>
                                        <span className="text-amber-500 font-bold">{m.leave}L</span>
                                    </div>
                                    <Badge className={cn(
                                        "rounded-lg text-[10px] font-black border-none min-w-[52px] justify-center",
                                        m.percentage >= 80 && "bg-emerald-500/10 text-emerald-600",
                                        m.percentage >= 60 && m.percentage < 80 && "bg-amber-500/10 text-amber-600",
                                        m.percentage < 60 && "bg-red-500/10 text-red-600",
                                    )}>
                                        {m.percentage.toFixed(0)}%
                                    </Badge>
                                </div>
                            </div>
                            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden flex">
                                {m.total > 0 && (
                                    <>
                                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(m.present / m.total) * 100}%` }} />
                                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${(m.leave / m.total) * 100}%` }} />
                                        <div className="bg-red-500 h-full transition-all" style={{ width: `${(m.absent / m.total) * 100}%` }} />
                                    </>
                                )}
                            </div>
                            {m.records && m.records.length > 0 && (
                                <div className="mt-4 pt-3 border-t flex flex-wrap gap-1.5">
                                    {m.records.sort((a, b) => a.date.localeCompare(b.date)).map(r => (
                                        <div key={r.date} className={cn("flex flex-col items-center justify-center w-8 h-8 rounded-md text-[10px] font-black border",
                                            r.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                            r.status === 'ABSENT' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                        )}>
                                            <span className="opacity-50 text-[8px] leading-none mb-0.5">{format(new Date(r.date), 'dd')}</span>
                                            <span className="leading-none">{r.status[0]}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && <EmptyState icon={CalendarDays} message="No records match selected filters" />}
            </div>
        </div>
    );
}

// ── Tab 3: Fee History ──
function FeeHistoryTab({ studentId }: { studentId: string }) {
    const { data, isLoading } = useFeeHistory(studentId);
    const [yearFilter, setYearFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [classFilter, setClassFilter] = useState('All');

    const years = useMemo(() => Array.from(new Set(data?.map(c => c.month_year.substring(0, 4)) ?? [])).sort().reverse(), [data]);

    const feeClasses = useMemo(() => {
        const classSet = new Map<string, string>();
        data?.forEach(c => {
            if (c.fee_structures?.classes) {
                const key = `${c.fee_structures.classes.name} ${c.fee_structures.classes.section}`.trim();
                classSet.set(key, key);
            }
        });
        return Array.from(classSet.values()).sort();
    }, [data]);

    const filtered = useMemo(() => {
        if (!data) return [];
        return data.filter(c => {
            if (yearFilter !== 'All' && !c.month_year.startsWith(yearFilter)) return false;
            if (statusFilter !== 'All' && c.status !== statusFilter) return false;
            if (classFilter !== 'All') {
                const cClass = c.fee_structures?.classes ? `${c.fee_structures.classes.name} ${c.fee_structures.classes.section}`.trim() : '';
                if (cClass !== classFilter) return false;
            }
            return true;
        });
    }, [data, yearFilter, statusFilter, classFilter]);

    if (isLoading) return <SkeletonCards count={4} />;
    if (!data || data.length === 0) return <EmptyState icon={Wallet} message="No fee records found" />;

    const totalBilled = filtered.reduce((s, c) => s + c.amount_due + c.arrears + c.fines - c.discount, 0);
    const totalPaid = filtered.reduce((s, c) => s + c.paid_amount, 0);
    const outstanding = totalBilled - totalPaid;

    const statusStyle: Record<string, string> = {
        PAID: 'bg-emerald-500/10 text-emerald-600',
        PARTIAL: 'bg-amber-500/10 text-amber-600',
        PENDING: 'bg-red-500/10 text-red-600',
        OVERDUE: 'bg-red-500/10 text-red-600',
    };

    const hasFilters = yearFilter !== 'All' || statusFilter !== 'All' || classFilter !== 'All';

    return (
        <div className="space-y-5">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-36 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Years" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="All">All Years</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="PARTIAL">Partial</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                </Select>
                {feeClasses.length > 0 && (
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-44 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent className="rounded-xl"><SelectItem value="All">All Classes</SelectItem>{feeClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                )}
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={() => { setYearFilter('All'); setStatusFilter('All'); setClassFilter('All'); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-9">Reset</Button>
                )}
                <Badge variant="outline" className="ml-auto text-[10px] font-bold">{filtered.length} challans</Badge>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Billed', value: `Rs. ${totalBilled.toLocaleString()}`, color: 'text-foreground' },
                    { label: 'Total Paid', value: `Rs. ${totalPaid.toLocaleString()}`, color: 'text-emerald-600' },
                    { label: 'Outstanding', value: `Rs. ${outstanding.toLocaleString()}`, color: outstanding > 0 ? 'text-red-500' : 'text-emerald-600' },
                ].map(s => (
                    <Card key={s.label} className="text-center py-3">
                        <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
                    </Card>
                ))}
            </div>

            {/* Challan rows */}
            <div className="space-y-2">
                {filtered.map((c: FeeHistoryEntry) => {
                    const totalDue = c.amount_due + c.arrears + c.fines - c.discount;
                    return (
                        <Card key={c.id} className="shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-black">{format(new Date(c.month_year + '-01'), 'MMM yyyy')}</div>
                                        {c.fee_structures?.classes && (
                                            <Badge variant="outline" className="text-[9px] font-bold">
                                                {c.fee_structures.classes.name} {c.fee_structures.classes.section}
                                            </Badge>
                                        )}
                                        {c.arrears > 0 && <Badge variant="outline" className="text-[9px] font-bold text-amber-600">+{c.arrears} arrears</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-xs font-black">Rs. {c.paid_amount.toLocaleString()} <span className="text-muted-foreground font-normal">/ {totalDue.toLocaleString()}</span></div>
                                        </div>
                                        <Badge className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest border-none min-w-[56px] justify-center", statusStyle[c.status] || statusStyle.PENDING)}>
                                            {c.status}
                                        </Badge>
                                    </div>
                                </div>
                                {(c.payment_method || c.paid_date) && (
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                                        {c.payment_method && <span>Via {c.payment_method}</span>}
                                        {c.paid_date && <span>• Paid {format(new Date(c.paid_date), 'dd MMM yyyy')}</span>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
                {filtered.length === 0 && <EmptyState icon={Wallet} message="No records match selected filters" />}
            </div>
        </div>
    );
}

// ── Tab 4: Results History (Reuses existing API) ──
function ResultsHistoryTab({ studentId }: { studentId: string }) {
    const { data: results, isLoading } = useGetAllResultsByStudent(studentId);
    const { data: promotions } = usePromotionHistory(studentId);
    const { data: enrollment } = useStudentEnrollment(studentId);
    const [yearFilter, setYearFilter] = useState('All');
    const [termFilter, setTermFilter] = useState('All');
    const [classFilter, setClassFilter] = useState('All');
    const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

    const toggleTerm = (key: string) => {
        setExpandedTerms(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const getGradeLetter = (pct: number) => {
        if (pct >= 85) return 'A';
        if (pct >= 70) return 'B';
        if (pct >= 50) return 'C';
        if (pct >= 40) return 'D';
        return 'F';
    };

    const getGradeColor = (pct: number) => {
        if (pct >= 80) return 'text-emerald-600 bg-emerald-500/10';
        if (pct >= 60) return 'text-blue-600 bg-blue-500/10';
        if (pct >= 40) return 'text-amber-600 bg-amber-500/10';
        return 'text-red-600 bg-red-500/10';
    };

    const getBarColor = (pct: number) => {
        if (pct >= 80) return 'bg-emerald-500';
        if (pct >= 60) return 'bg-blue-500';
        if (pct >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    // Extract all unique classes from results, promotions, and enrollment
    const allClasses = useMemo(() => {
        const classSet = new Set<string>();
        
        // 1. Classes from results data
        ((results as any[]) ?? []).forEach(r => {
            if (r.classes?.name) {
                classSet.add(`${r.classes.name} ${r.classes.section || ''}`.trim());
            }
        });
        
        // 2. Classes from promotion history
        promotions?.forEach(p => {
            if (p.from_class) classSet.add(`${p.from_class.name} ${p.from_class.section}`.trim());
            if (p.to_class) classSet.add(`${p.to_class.name} ${p.to_class.section}`.trim());
        });
        
        // 3. Current enrolled class
        if (enrollment?.classes) {
            classSet.add(`${enrollment.classes.name} ${enrollment.classes.section}`.trim());
        }
        
        return Array.from(classSet).filter(Boolean).sort();
    }, [results, promotions, enrollment]);

    // Group by academic_year → term + class (with class filter)
    const grouped = useMemo(() => {
        const g: Record<string, Record<string, any[]>> = {};
        ((results as any[]) ?? []).forEach(r => {
            const rClass = `${r.classes?.name || ''} ${r.classes?.section || ''}`.trim();
            // Apply class filter
            if (classFilter !== 'All') {
                if (rClass !== classFilter) return;
            }
            const year = r.exam_terms?.academic_year ?? 'Unknown';
            const term = r.exam_terms?.name ?? 'Unknown';
            const groupKey = `${term}__CLASS__${rClass}`;
            
            if (!g[year]) g[year] = {};
            if (!g[year][groupKey]) g[year][groupKey] = [];
            g[year][groupKey].push(r);
        });
        return g;
    }, [results, classFilter]);

    const allYears = useMemo(() => Object.keys(grouped).sort().reverse(), [grouped]);
    const allTerms = useMemo(() => Array.from(new Set(Object.values(grouped).flatMap(y => Object.keys(y).map(k => k.split('__CLASS__')[0])))).sort(), [grouped]);

    const filteredYears = yearFilter === 'All' ? allYears : allYears.filter(y => y === yearFilter);

    // Overall summary across all filtered results
    const overallSummary = useMemo(() => {
        let totalObt = 0, totalMax = 0, totalExams = 0;
        filteredYears.forEach(year => {
            const termEntries = Object.entries(grouped[year] || {}).filter(([key]) => termFilter === 'All' || key.split('__CLASS__')[0] === termFilter);
            termEntries.forEach(([, termResults]) => {
                totalExams++;
                termResults.forEach((r: any) => {
                    totalObt += Number(r.obtained_marks || 0);
                    totalMax += Number(r.total_marks || 0);
                });
            });
        });
        const pct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
        return { totalObt, totalMax, pct, totalExams, grade: getGradeLetter(pct) };
    }, [grouped, filteredYears, termFilter]);

    if (isLoading) return <SkeletonCards count={3} />;
    if (!results || results.length === 0) return <EmptyState icon={ClipboardList} message="No results recorded yet" />;

    const hasFilters = yearFilter !== 'All' || termFilter !== 'All' || classFilter !== 'All';

    return (
        <div className="space-y-5">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-36 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Years" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="All">All Years</SelectItem>{allYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={termFilter} onValueChange={setTermFilter}>
                    <SelectTrigger className="w-44 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Terms" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="All">All Terms</SelectItem>{allTerms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {allClasses.length > 0 && (
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-44 h-9 rounded-xl border-2 text-xs font-bold"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent className="rounded-xl"><SelectItem value="All">All Classes</SelectItem>{allClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                )}
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={() => { setYearFilter('All'); setTermFilter('All'); setClassFilter('All'); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-9">Reset</Button>
                )}
                <Badge variant="outline" className="ml-auto text-[10px] font-bold">{overallSummary.totalExams} exams</Badge>
            </div>

            {/* Overall Summary Cards */}
            {overallSummary.totalMax > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="text-center py-3">
                        <p className="text-xl font-black text-foreground">{overallSummary.totalObt}<span className="text-sm text-muted-foreground font-normal">/{overallSummary.totalMax}</span></p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Total Marks</p>
                    </Card>
                    <Card className="text-center py-3">
                        <p className={`text-xl font-black ${getGradeColor(overallSummary.pct).split(' ')[0]}`}>{overallSummary.pct.toFixed(1)}%</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Percentage</p>
                    </Card>
                    <Card className="text-center py-3">
                        <p className={`text-xl font-black ${getGradeColor(overallSummary.pct).split(' ')[0]}`}>{overallSummary.grade}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Grade</p>
                    </Card>
                    <Card className="text-center py-3">
                        <p className={`text-xl font-black ${overallSummary.pct >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{overallSummary.pct >= 40 ? 'PASS' : 'FAIL'}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Status</p>
                    </Card>
                </div>
            )}

            {/* Term Cards */}
            {filteredYears.map(year => {
                const termEntries = Object.entries(grouped[year]).filter(([key]) => termFilter === 'All' || key.split('__CLASS__')[0] === termFilter);
                if (termEntries.length === 0) return null;
                return (
                    <div key={year} className="space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5" /> Session {year}
                        </div>
                        {termEntries.map(([groupKey, termResults]) => {
                            const termName = groupKey.split('__CLASS__')[0];
                            const totalObt = termResults.reduce((s: number, r: any) => s + Number(r.obtained_marks || 0), 0);
                            const totalMax = termResults.reduce((s: number, r: any) => s + Number(r.total_marks || 0), 0);
                            const pct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
                            const termKey = `${year}-${groupKey}`;
                            const isExpanded = expandedTerms.has(termKey) || termEntries.length <= 2;
                            const termClass = termResults[0]?.classes;

                            return (
                                <Card key={groupKey} className="shadow-sm overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Term Header - clickable */}
                                        <button
                                            type="button"
                                            onClick={() => toggleTerm(termKey)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="font-black text-sm uppercase tracking-tight text-primary italic">{termName}</div>
                                                {termClass && (
                                                    <Badge variant="outline" className="text-[9px] font-bold">{termClass.name} {termClass.section}</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-muted-foreground">{totalObt}/{totalMax}</span>
                                                <Badge className={cn("rounded-lg text-[10px] font-black border-none", getGradeColor(pct))}>{pct.toFixed(1)}%</Badge>
                                                <Badge className={cn("rounded-lg text-[10px] font-black border-none", getGradeColor(pct))}>{getGradeLetter(pct)}</Badge>
                                                <Badge className={cn("rounded-lg text-[9px] font-black uppercase border-none",
                                                    pct >= 40 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                                )}>{pct >= 40 ? 'PASS' : 'FAIL'}</Badge>
                                                {termEntries.length > 2 && (
                                                    isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Subject Rows - collapsible */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-2.5 border-t border-border/30 pt-3">
                                                {termResults.map((r: any) => {
                                                    const subPct = Number(r.total_marks) > 0 ? (Number(r.obtained_marks) / Number(r.total_marks)) * 100 : 0;
                                                    return (
                                                        <div key={r.id} className="space-y-1">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-bold text-xs uppercase">{r.subjects?.name ?? '—'}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-mono text-xs text-muted-foreground">{r.obtained_marks}/{r.total_marks}</span>
                                                                    <Badge variant="outline" className="text-[9px] font-bold min-w-[40px] justify-center rounded-md">{subPct.toFixed(0)}%</Badge>
                                                                    <Badge className={cn("text-[9px] font-black min-w-[24px] justify-center rounded-md border-none", getGradeColor(subPct))}>{getGradeLetter(subPct)}</Badge>
                                                                </div>
                                                            </div>
                                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div className={cn("h-full rounded-full transition-all", getBarColor(subPct))} style={{ width: `${Math.min(subPct, 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                );
            })}

            {filteredYears.length === 0 && <EmptyState icon={ClipboardList} message="No results match selected filters" />}
        </div>
    );
}

// ── Shared helpers ──
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                <Icon className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest italic">{message}</p>
        </div>
    );
}

function SkeletonCards({ count }: { count: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
        </div>
    );
}
