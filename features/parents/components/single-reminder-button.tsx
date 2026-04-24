'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendFeeRemindersAction } from '@/features/parents/api/send-fee-reminders.action';
import { cn } from '@/lib/utils';

interface SingleReminderButtonProps {
    parentId: string;
    hasStudents: boolean;
}

export function SingleReminderButton({ parentId, hasStudents }: SingleReminderButtonProps) {
    const [isPending, setIsPending] = useState(false);

    const handleSendReminder = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsPending(true);
        try {
            const result = await sendFeeRemindersAction(parentId);
            if (result.success) {
                if (result.count === 0) {
                    toast.info('No Pending Dues', { description: 'This parent has no pending or overdue challans.' });
                } else {
                    toast.success('Reminder Sent', { description: 'Fee reminder sent successfully.' });
                }
            } else {
                toast.error('Failed to send reminder', { description: result.error });
            }
        } catch {
            toast.error('Error', { description: 'An unexpected error occurred.' });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
                "h-8 w-8",
                !hasStudents ? "text-muted-foreground/40 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            )}
            onClick={hasStudents ? handleSendReminder : undefined}
            disabled={isPending || !hasStudents}
            title={hasStudents ? "Send Fee Reminder" : "No students enrolled - Cannot send reminder"}
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        </Button>
    );
}
