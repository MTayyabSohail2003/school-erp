'use client';

import { motion } from 'framer-motion';
import { Users, Megaphone } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useParentNotices, useNoticesRealtime } from '../api/use-notices';
import { PageTransition } from '@/components/ui/motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { type Notice } from '../api/use-notices';

export function ParentNoticeBoardPage() {
    useNoticesRealtime();
    const router = useRouter();
    const searchParams = useSearchParams();
    const noticeId = searchParams.get('noticeId');

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const dateQuery = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    const { data: notices, isLoading } = useParentNotices(dateQuery);

    // Handle deep-linking
    useEffect(() => {
        if (noticeId && notices && !selectedNotice) {
            const notice = notices.find(n => n.id === noticeId);
            if (notice) {
                // Use setTimeout to avoid cascading render warning
                setTimeout(() => setSelectedNotice(notice), 0);
                
                const params = new URLSearchParams(searchParams.toString());
                params.delete('noticeId');
                router.replace(`${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
            }
        }
    }, [noticeId, notices, selectedNotice, searchParams, router]);

    return (
        <PageTransition>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
                            <p className="text-sm text-muted-foreground">
                                Official school announcements and updates
                            </p>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal h-10 px-3 min-w-[140px]",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <Megaphone className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                            />
                            {selectedDate && (
                                <div className="p-2 border-t border-muted/20 bg-muted/5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7 text-xs font-semibold"
                                        onClick={() => setSelectedDate(undefined)}
                                    >
                                        Clear Filter
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Notices */}
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                ) : !notices || notices.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-muted-foreground">No notices yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                School announcements will appear here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {notices?.map((notice, idx) => (
                            <motion.div
                                key={notice.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                            >
                                <Card 
                                    className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500/40 hover:border-blue-500/60 group/card"
                                    onClick={() => setSelectedNotice(notice)}
                                >
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <h3 className="font-semibold text-sm group-hover/card:text-blue-600 transition-colors uppercase tracking-tight">{notice.title}</h3>
                                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                        School Notice
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed pl-4 line-clamp-2">
                                                    {notice.body}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-2 pl-4">
                                                    {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Notice Detail Dialog */}
                <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
                    <DialogContent className="max-w-2xl bg-card border-blue-500/20">
                        <DialogHeader className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                    <DialogTitle className="text-xl font-bold leading-tight uppercase tracking-tight">
                                        {selectedNotice?.title}
                                    </DialogTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 px-2 py-0 border-blue-500/20 text-[10px]">
                                            School Notice
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-muted/20">
                                            {selectedNotice?.created_at && format(new Date(selectedNotice.created_at), 'PPP')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="mt-4 bg-muted/20 p-6 rounded-2xl border border-muted/30 min-h-[150px] whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-sans">
                            {selectedNotice?.body}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PageTransition>
    );
}
