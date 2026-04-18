'use client';

import { ResultsManagement } from '@/features/results/components/results-management';
import { PageTransition } from '@/components/ui/motion';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ResultsPage() {
    const { data: profile, isLoading } = useAuthProfile();

    if (isLoading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
        );
    }

    // Role protection: Only ADMIN can access this page
    if (profile?.role !== 'ADMIN') {
        return (
            <div className="h-[80vh] flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-red-500/20 bg-red-500/5 backdrop-blur-xl rounded-[2rem]">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-4">
                        <div className="h-16 w-16 rounded-3xl bg-red-500/10 flex items-center justify-center">
                            <ShieldAlert className="h-8 w-8 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic text-red-600">Access Denied</h2>
                            <p className="text-sm text-red-600/60 font-medium">You do not have the required permissions to view this secure portal.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <PageTransition>
            <ResultsManagement />
        </PageTransition>
    );
}
