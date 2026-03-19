import { ParentsTable } from '@/features/parents/components/parents-table';
import { AddParentDialog } from '@/features/parents/components/add-parent-dialog';
import { SendRemindersButton } from '@/features/parents/components/send-reminders-button';

export const metadata = {
    title: 'Parents Directory | School ERP',
    description: 'Manage parent accounts and their details',
};

export default function ParentsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Parents Directory</h2>
                    <p className="text-muted-foreground mt-1">
                        View and manage all parent accounts in the system.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <SendRemindersButton />
                    <AddParentDialog />
                </div>
            </div>

            <ParentsTable />
        </div>
    );
}
