'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useContextNotices, useNoticesRealtime } from '@/features/notices/api/use-notices';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { ROUTES } from '@/constants/globals';
import Link from 'next/link';

export function AnnouncementBanner() {
    useNoticesRealtime();
    const { data: notices } = useContextNotices();
    const { data: profile } = useAuthProfile();
    const [dismissed, setDismissed] = useState<string | null>(null);

    // Show only the latest notice if not dismissed
    const latest = notices?.[0];
    const isVisible = latest && latest.id !== dismissed;

    // Determine correct notice board link based on role
    const getNoticeBoardLink = () => {
        if (!latest) return ROUTES.NOTICE_BOARD;
        if (profile?.role === 'TEACHER') return `${ROUTES.TEACHER_NOTICE_BOARD}?noticeId=${latest.id}`;
        if (profile?.role === 'PARENT') return `${ROUTES.PARENT_NOTICE_BOARD}?noticeId=${latest.id}`;
        return `${ROUTES.NOTICE_BOARD}?noticeId=${latest.id}`;
    };

    if (!isVisible || !latest) return null;

    // Clean body for banner: replace newlines and truncate
    const cleanBody = latest.body.replace(/\n+/g, ' ').trim();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
            >
                <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-3 text-sm">
                    <Megaphone className="h-4 w-4 text-primary shrink-0" />
                    
                    <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                        <span className="font-bold text-primary whitespace-nowrap">{latest.title}</span>
                        <span className="text-muted-foreground truncate max-w-[200px] md:max-w-[500px]">
                            {cleanBody}
                        </span>
                        
                        <Link 
                            href={getNoticeBoardLink()}
                            className="text-primary hover:underline font-medium inline-flex items-center gap-1 shrink-0 ml-auto md:ml-0"
                        >
                            View Details <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground/60 hidden lg:block">
                            {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
                        </span>
                        <button
                            onClick={() => setDismissed(latest.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            aria-label="Dismiss notice"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
