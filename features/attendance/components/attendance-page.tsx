'use client';

import { useAuthProfile } from '@/features/auth/hooks/use-auth';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition } from '@/components/ui/motion';
import { Loader } from '@/components/ui/loader';

import { StudentAttendanceView } from './student-attendance-view';
import { StaffAttendanceView } from './staff-attendance-view';
import { ParentAttendanceView } from './parent-attendance-view';

export function AttendancePage() {
    const { data: profile, isLoading } = useAuthProfile();

    if (isLoading || !profile) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader text="Loading attendance portal..." />
            </div>
        );
    }

    // Role-based rendering
    if (profile.role === 'PARENT') {
        return <ParentAttendanceView />;
    }

    if (profile.role === 'TEACHER') {
        return <StudentAttendanceView />;
    }

    // ADMIN View (Can see both Students and Staff)
    return (
        <PageTransition>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
                    <p className="text-sm text-muted-foreground">Manage and overview attendance for all entities</p>
                </div>

                <Tabs defaultValue="students" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="students">Student Attendance</TabsTrigger>
                        <TabsTrigger value="staff">Staff Attendance</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="students" className="mt-0 outline-none">
                            <StudentAttendanceView />
                        </TabsContent>
                        <TabsContent value="staff" className="mt-0 outline-none">
                            <StaffAttendanceView />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </PageTransition>
    );
}
