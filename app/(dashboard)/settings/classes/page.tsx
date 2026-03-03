import { AddClassDialog } from '@/features/classes/components/add-class-dialog';
import { ClassesTable } from '@/features/classes/components/classes-table';

export const metadata = {
    title: 'Class Settings - School ERP',
};

export default function ClassesPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Class Settings</h1>
                    <p className="text-muted-foreground">
                        Configure the classes and sections available in your school.
                    </p>
                </div>

                <AddClassDialog />
            </div>

            <ClassesTable />
        </div>
    );
}
