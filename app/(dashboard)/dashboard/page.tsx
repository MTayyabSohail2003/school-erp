'use client';

import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
    const { data: profile } = useAuthProfile();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard overview</h1>
                <p className="text-muted-foreground">
                    Welcome back, here is what is happening today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground text-center flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold leading-none">R</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profile?.role || 'Unknown'}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center bg-white">
                <p className="text-muted-foreground">
                    You have successfully initialized Phase 1! The auth architecture is fully functional.
                </p>
            </div>
        </div>
    );
}
