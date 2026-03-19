'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendFeeRemindersAction } from '@/features/parents/api/send-fee-reminders.action';

export function SendRemindersButton() {
    const [isPending, setIsPending] = useState(false);

    const handleSendReminders = async () => {
        setIsPending(true);
        try {
            const result = await sendFeeRemindersAction();
            if (result.success) {
                if (result.count === 0) {
                    toast.info('No Reminders Sent', { description: result.message });
                } else {
                    toast.success('Reminders Sent', { description: result.message });
                }
            } else {
                toast.error('Failed to send reminders', { description: result.error });
            }
        } catch {
            toast.error('Error', { description: 'An unexpected error occurred.' });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Button 
            variant="outline" 
            onClick={handleSendReminders} 
            disabled={isPending}
            className="gap-2 bg-white"
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Fee Reminders (Dynamic)
        </Button>
    );
}
