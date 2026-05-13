'use client';

import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { AdminDashboard } from '@/features/dashboard/components/admin-dashboard';
import { TeacherDashboard } from '@/features/dashboard/components/teacher-dashboard';
import { ParentDashboard } from '@/features/dashboard/components/parent-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { data: profile, isLoading } = useAuthProfile();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-1/3 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
                <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
        );
    }

    if (!profile) return null;

    if (profile.role === 'ADMIN') {
        return <AdminDashboard profile={profile} />;
    }

    if (profile.role === 'TEACHER') {
        return <TeacherDashboard profile={profile} />;
    }

    if (profile.role === 'PARENT') {
        return <ParentDashboard profile={profile} />;
    }

    // Fallback
    return (
        <div className="flex bg-muted/20 items-center justify-center p-12 text-muted-foreground border-dashed border-2 rounded-xl">
            <p>Unhandled role: {profile.role}. Please contact the system administrator.</p>
        </div>
    );
}
