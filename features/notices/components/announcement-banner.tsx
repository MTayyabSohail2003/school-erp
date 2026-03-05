'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotices, useNoticesRealtime } from '@/features/notices/api/use-notices';

export function AnnouncementBanner() {
    useNoticesRealtime();
    const { data: notices } = useNotices();
    const [dismissed, setDismissed] = useState<string | null>(null);

    // Show only the latest notice if not dismissed
    const latest = notices?.[0];
    const isVisible = latest && latest.id !== dismissed;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                >
                    <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-3 text-sm">
                        <Megaphone className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-primary">{latest.title}</span>
                        <span className="text-muted-foreground flex-1 truncate">{latest.body}</span>
                        <span className="text-xs text-muted-foreground/60 shrink-0 hidden sm:block">
                            {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
                        </span>
                        <button
                            onClick={() => setDismissed(latest.id)}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Dismiss notice"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
