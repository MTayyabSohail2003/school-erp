import { Metadata } from 'next';
import { NotificationTemplateList } from '@/features/notifications/components/notification-template-list';
import { PageTransition } from '@/components/ui/motion';

export const metadata: Metadata = {
    title: 'Notification Templates | AR-School ERP',
    description: 'System-wide notification registry and configuration.',
};

export default function NotificationTemplatesPage() {
    return (
        <PageTransition>
            <div className="flex flex-col gap-8 max-w-6xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Notification System</h1>
                    <p className="text-muted-foreground text-sm max-w-2xl">
                        This registry defines all automated alerts triggered by the ERP across different roles. 
                        Notifications are delivered in real-time through the notification bell and on-screen toasts.
                    </p>
                </div>
                
                <NotificationTemplateList />
            </div>
        </PageTransition>
    );
}
