'use client';

import { AddStudentDialog } from '@/features/students/components/add-student-dialog';
import { PromoteStudentsDialog } from '@/features/students/components/promote-students-dialog';
import { StudentsTable } from '@/features/students/components/students-table';
import { PageTransition } from '@/components/ui/motion';
import { Users } from 'lucide-react';

export default function StudentsPage() {
    return (
        <PageTransition>
            <div className="space-y-7">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage records, profiles, and document vaults.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <PromoteStudentsDialog />
                        <AddStudentDialog />
                    </div>
                </div>

                {/* Data Table */}
                <StudentsTable />
            </div>
        </PageTransition>
    );
}
