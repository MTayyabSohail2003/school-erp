'use client';

import { useState } from 'react';
import { useGetPeriods } from '../hooks/use-get-periods';
import { useGetAllTimetable } from '../hooks/use-get-all-timetable';
import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { useGetSubjects } from '@/features/subjects/hooks/use-get-subjects';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { MiniTimetableGrid, type Brush } from './mini-timetable-grid';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LayoutGrid, AlertCircle, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const CURRENT_ACADEMIC_YEAR = '2026-2027';

export function BulkScheduleModal() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: periods, isLoading: isPeriodsLoading } = useGetPeriods();
    const { data: allTimetable, isLoading: isTimetableLoading } = useGetAllTimetable(CURRENT_ACADEMIC_YEAR);
    const { data: classes, isLoading: isClassesLoading } = useClasses();
    const { data: teachers } = useGetStaff();
    const { data: subjects } = useGetSubjects();

    const [selectedBrush, setSelectedBrush] = useState<Brush | null>(null);

    const isLoading = isPeriodsLoading || isTimetableLoading || isClassesLoading;

    // Filter to only secondary classes (5th-10th generally, or just non-primary for this feature)
    const secondaryClasses = classes?.filter(c => {
        const isPrimary = c.name.toLowerCase().includes('nursery') ||
            c.name.toLowerCase().includes('prep') ||
            ['1', '2', '3', '4'].some(grade => {
                const regex = new RegExp(`(^|\\s)${grade}(\\s|$)`, 'i');
                return regex.test(c.name);
            });
        return !isPrimary;
    }) || [];

    const filteredClasses = secondaryClasses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.section || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="font-bold text-xs uppercase tracking-wider">Bulk Builder</span>
                </Button>
            </DialogTrigger>

            <DialogContent showCloseButton={false} className="max-w-[98vw] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[98vw] xl:max-w-[98vw] w-[98vw] h-[98vh] p-0 flex flex-col gap-0 border-primary/20 bg-background/95 backdrop-blur-xl overflow-hidden rounded-2xl">
                {/* Header Toolbar */}
                <div className="flex-none px-6 py-4 border-b border-border/50 bg-card/50 flex flex-wrap items-center justify-between gap-4 z-20 shadow-sm">
                    <DialogHeader className="p-0 m-0">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                <LayoutGrid className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    BULK SCHEDULE BUILDER
                                </h2>
                                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                                    Cross-Class Period Management
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Shared Brush Controller */}
                    <div className="flex-1 max-w-2xl bg-primary/[0.03] border border-primary/10 p-2 rounded-xl flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-1">Global Teacher Brush</label>
                            <select
                                className="w-full h-10 text-xs bg-background border border-input rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium shadow-sm"
                                value={selectedBrush?.teacherId || ''}
                                onChange={(e) => {
                                    const teacher = teachers?.find(t => t.id === e.target.value);
                                    if (teacher) {
                                        setSelectedBrush(prev => ({
                                            teacherId: teacher.id || '',
                                            teacherName: teacher.full_name,
                                            subjectId: prev?.subjectId || '',
                                            subjectName: prev?.subjectName || ''
                                        }));
                                    } else {
                                        setSelectedBrush(null);
                                    }
                                }}
                            >
                                <option value="">1. Select Teacher...</option>
                                {teachers?.map(t => (
                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pl-1">Global Subject Brush</label>
                            <select
                                className="w-full h-10 text-xs bg-background border border-input rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium shadow-sm"
                                value={selectedBrush?.subjectId || ''}
                                onChange={(e) => {
                                    const subject = subjects?.find(s => s.id === e.target.value);
                                    if (subject) {
                                        setSelectedBrush(prev => ({
                                            teacherId: prev?.teacherId || '',
                                            teacherName: prev?.teacherName || '',
                                            subjectId: subject.id,
                                            subjectName: subject.name
                                        }));
                                    } else if (!selectedBrush?.teacherId) {
                                        setSelectedBrush(null);
                                    }
                                }}
                                disabled={!selectedBrush?.teacherId}
                            >
                                <option value="">2. Select Subject...</option>
                                {subjects?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        {selectedBrush && selectedBrush.teacherId && selectedBrush.subjectId ? (
                            <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl h-10 shadow-sm animate-in fade-in zoom-in duration-200">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <span className="text-xs font-bold text-green-700 dark:text-green-400">Brush Ready</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold h-10">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Select both to paint</span>
                            </div>
                        )}
                        
                        {selectedBrush && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => setSelectedBrush(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-muted shrink-0 ml-2">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </DialogClose>
                    </div>
                </div>

                {/* Sub-header / Filters */}
                <div className="flex-none px-6 py-2 bg-muted/20 border-b border-border/30 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Showing {filteredClasses.length} {filteredClasses.length === 1 ? 'Class' : 'Classes'}
                    </p>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                        <Input 
                            placeholder="Filter classes..." 
                            className="h-8 pl-8 text-xs bg-background/50 border-border/50 focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Scrollable Work Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <div className="p-4 rounded-full bg-primary/5 animate-pulse">
                                <LayoutGrid className="h-8 w-8 text-primary/40" />
                            </div>
                            <p className="text-sm font-semibold tracking-tight animate-pulse">Initializing Matrix...</p>
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl m-8">
                            <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm font-medium">No secondary classes found matching criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start auto-rows-max pb-20">
                            {filteredClasses.map(cls => (
                                <MiniTimetableGrid
                                    key={cls.id}
                                    classId={cls.id}
                                    className={cls.name}
                                    section={cls.section || ''}
                                    academicYear={CURRENT_ACADEMIC_YEAR}
                                    periods={periods || []}
                                    timetable={(allTimetable || []).filter(t => t.class_id === cls.id)}
                                    brush={selectedBrush?.teacherId && selectedBrush?.subjectId ? selectedBrush : null}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
