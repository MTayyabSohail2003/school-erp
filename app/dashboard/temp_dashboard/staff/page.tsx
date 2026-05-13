'use client';

import { AddStaffDialog } from '@/features/staff/components/add-staff-dialog';
import { StaffTable } from '@/features/staff/components/staff-table';
import { PageTransition } from '@/components/ui/motion';
import { Briefcase } from 'lucide-react';

export default function StaffPage() {
    return (
        <PageTransition>
            <div className="space-y-7">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage teacher profiles, credentials, and salary records.
                            </p>
                        </div>
                    </div>

                    <AddStaffDialog />
                </div>

                {/* Data Table */}
                <StaffTable />
            </div>
        </PageTransition>
    );
}
