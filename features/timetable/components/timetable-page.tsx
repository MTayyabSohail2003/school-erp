'use client';

import { useState } from 'react';
import { Calendar, User } from 'lucide-react';

import { useClasses } from '@/features/classes/hooks/use-classes';
import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { useGetClassTimetable } from '../hooks/use-get-class-timetable';
import { useGetTeacherTimetable } from '../hooks/use-get-teacher-timetable';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/motion';
import { ClassTimetableGrid } from './class-timetable-grid';
import { TeacherTimetableGrid } from './teacher-timetable-grid';

// In a real app this would likely come from context or DB config
const CURRENT_ACADEMIC_YEAR = '2026-2027';

export function TimetablePage() {
    const { data: classes, isLoading: isClassesLoading } = useClasses();
    const { data: teachers, isLoading: isTeachersLoading } = useGetStaff();

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

    // Set initial values once loaded
    if (!selectedClassId && classes && classes.length > 0) {
        setSelectedClassId(classes[0].id);
    }
    if (!selectedTeacherId && teachers && teachers.length > 0) {
        setSelectedTeacherId(teachers[0].id || '');
    }

    const { data: classTimetable = [] } = useGetClassTimetable(selectedClassId, CURRENT_ACADEMIC_YEAR);
    const { data: teacherTimetable = [] } = useGetTeacherTimetable(selectedTeacherId, CURRENT_ACADEMIC_YEAR);

    return (
        <PageTransition>
            <div className="space-y-6">
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
                </div>

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
                                            <option value="" disabled>Loading classes...</option>
                                            {classes?.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} - {c.section}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            {selectedClassId ? (
                                <ClassTimetableGrid
                                    classId={selectedClassId}
                                    academicYear={CURRENT_ACADEMIC_YEAR}
                                    timetable={classTimetable}
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
                                            <option value="" disabled>Loading teachers...</option>
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
