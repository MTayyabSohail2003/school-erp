'use client';

import { useState } from 'react';
import { Calendar, User, CalendarDays, Plus } from 'lucide-react';

import { useClasses } from '@/features/classes/hooks/use-classes';
import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { useGetPeriods } from '../hooks/use-get-periods';
import { useGetSubjects } from '@/features/subjects/hooks/use-get-subjects';
import { useGetClassTimetable } from '../hooks/use-get-class-timetable';
import { useGetTeacherTimetable } from '../hooks/use-get-teacher-timetable';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/motion';
import { ClassTimetableGrid } from './class-timetable-grid';
import { TeacherTimetableGrid } from './teacher-timetable-grid';

// In a real app this would likely come from context or DB config
const CURRENT_ACADEMIC_YEAR = '2026-2027';

export function TimetablePage() {
    const { data: classes, isLoading: isClassesLoading } = useClasses();
    const { data: teachers, isLoading: isTeachersLoading } = useGetStaff();
    const { data: subjects } = useGetSubjects();

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

    // Pre-select first available if nothing is selected and data is loaded
    if (!selectedClassId && classes && classes.length > 0) {
        setSelectedClassId(classes[0].id);
    }
    if (!selectedTeacherId && teachers && teachers.length > 0) {
        setSelectedTeacherId(teachers[0].id || '');
    }

    const { data: periods } = useGetPeriods();
    const { data: classTimetable = [] } = useGetClassTimetable(selectedClassId, CURRENT_ACADEMIC_YEAR);
    const { data: teacherTimetable = [] } = useGetTeacherTimetable(selectedTeacherId, CURRENT_ACADEMIC_YEAR);

    // Paint Mode State
    const [selectedBrush, setSelectedBrush] = useState<{ teacherId: string; subjectId: string; teacherName: string; subjectName: string } | null>(null);

    return (
        <PageTransition>
            <div className="w-full max-w-full overflow-x-hidden min-w-0 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Timetable Engine</h1>
                            <p className="text-sm text-muted-foreground">Manage and view schedules across the institution</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Pro Builder Trigger */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 transition-all">
                                    <div className="h-5 w-5 rounded-md bg-primary/20 flex items-center justify-center">
                                        <Plus className="h-3 w-3 text-primary" />
                                    </div>
                                    <span className="font-bold text-xs uppercase tracking-wider">Pro Builder</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] border-primary/20 bg-card/95 backdrop-blur-xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Plus className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="font-black tracking-tight">PRO BUILDER ENGINE</span>
                                    </DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-6 pt-4">
                                    <div className="p-4 rounded-xl bg-primary/[0.03] border border-primary/10 space-y-3">
                                        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                            Select your combination below to load your <span className="text-primary font-bold">Brush</span>. Once loaded, click any empty slot in the grid to instantly schedule.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase pl-1">Teacher</label>
                                            <select 
                                                className="w-full h-12 text-sm bg-muted/20 border border-primary/10 rounded-xl px-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                onChange={(e) => {
                                                    const teacherId = e.target.value;
                                                    const teacher = teachers?.find(t => t.id === teacherId);
                                                    if (teacher) {
                                                        setSelectedBrush(prev => ({
                                                            teacherId: teacher.id || '',
                                                            teacherName: teacher.full_name,
                                                            subjectId: prev?.subjectId || '',
                                                            subjectName: prev?.subjectName || 'Select Subject'
                                                        }));
                                                    }
                                                }}
                                                value={selectedBrush?.teacherId || ''}
                                            >
                                                <option value="">Choose Teacher...</option>
                                                {teachers?.map(t => (
                                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase pl-1">Subject</label>
                                            <select 
                                                className="w-full h-12 text-sm bg-muted/20 border border-primary/10 rounded-xl px-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                onChange={(e) => {
                                                    const subjectId = e.target.value;
                                                    const subject = subjects?.find(s => s.id === subjectId);
                                                    if (subject) {
                                                        setSelectedBrush(prev => ({
                                                            teacherId: prev?.teacherId || '',
                                                            teacherName: prev?.teacherName || 'Select Teacher',
                                                            subjectId: subject.id,
                                                            subjectName: subject.name
                                                        }));
                                                    }
                                                }}
                                                value={selectedBrush?.subjectId || ''}
                                            >
                                                <option value="">Choose Subject...</option>
                                                {subjects?.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-primary/10 flex justify-end">
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                                                Start Painting Slots
                                            </Button>
                                        </DialogTrigger>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {selectedBrush && (
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-background border border-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Active Brush</p>
                                <p className="text-sm font-bold truncate">
                                    {selectedBrush.subjectName} <span className="text-muted-foreground font-normal mx-1">/</span> {selectedBrush.teacherName}
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedBrush(null)}
                            className="h-9 px-3 hover:bg-destructive/10 hover:text-destructive text-muted-foreground font-bold text-xs"
                        >
                            Reset Brush
                        </Button>
                    </div>
                )}

                {!isClassesLoading && (!periods || periods.length === 0) && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No Time Periods Found</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400/80">
                                You need to define your school slots (e.g. Period 1, Period 2) in the 
                                <a href="/academics" className="mx-1 font-bold underline hover:text-amber-900 dark:hover:text-amber-200">Academics Setup</a> 
                                before you can create a timetable.
                            </p>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="class" className="w-full">
                    <TabsList className="grid w-full max-w-sm grid-cols-2">
                        <TabsTrigger value="class">Class View</TabsTrigger>
                        <TabsTrigger value="teacher">Teacher View</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        {/* Class View Tab */}
                        <TabsContent value="class" className="mt-0 outline-none space-y-4">
                            <Card>
                                <CardContent className="pt-5 pb-4">
                                    <div className="flex flex-col gap-1.5 max-w-sm">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Class</label>
                                        <select
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                            value={selectedClassId}
                                            onChange={(e) => setSelectedClassId(e.target.value)}
                                            disabled={isClassesLoading}
                                        >
                                            <option value="">None (Select Class)</option>
                                            {classes?.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} - {c.section}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            {selectedClassId && classes ? (
                                <ClassTimetableGrid
                                    classRecord={classes.find(c => c.id === selectedClassId)!}
                                    academicYear={CURRENT_ACADEMIC_YEAR}
                                    timetable={classTimetable}
                                    selectedBrush={selectedBrush}
                                />
                            ) : (
                                <div className="p-12 text-center text-muted-foreground border rounded-xl bg-muted/10">
                                    Please select a class to view its timetable.
                                </div>
                            )}
                        </TabsContent>

                        {/* Teacher View Tab */}
                        <TabsContent value="teacher" className="mt-0 outline-none space-y-4">
                            <Card>
                                <CardContent className="pt-5 pb-4">
                                    <div className="flex flex-col gap-1.5 max-w-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Teacher</label>
                                        </div>
                                        <select
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                            value={selectedTeacherId}
                                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                                            disabled={isTeachersLoading}
                                        >
                                            <option value="">None (Select Teacher)</option>
                                            {teachers?.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            {selectedTeacherId ? (
                                <TeacherTimetableGrid
                                    timetable={teacherTimetable}
                                />
                            ) : (
                                <div className="p-12 text-center text-muted-foreground border rounded-xl bg-muted/10">
                                    Please select a teacher to view their schedule.
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </PageTransition>
    );
}
