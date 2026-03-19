'use client';

import { useNotices, useTeacherNotices, useParentNotices, useDeleteNotice } from '../api/use-notices';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Megaphone, ChevronRight, Bell, Calendar as CalendarIcon, 
    Trash2, GraduationCap, Users, Globe 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ROUTES } from '@/constants/globals';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { type NoticeAudience } from '../api/use-notices';

const AUDIENCE_ICONS: Record<NoticeAudience, React.ElementType> = {
    TEACHER: GraduationCap,
    PARENT: Users,
    ALL: Globe,
};

interface NoticeBoardWidgetProps {
    role: 'ADMIN' | 'TEACHER' | 'PARENT';
}

export function NoticeBoardWidget({ role }: NoticeBoardWidgetProps) {
    // Select the appropriate hook based on role
    const adminQuery = useNotices();
    const teacherQuery = useTeacherNotices();
    const parentQuery = useParentNotices();

    const query = role === 'ADMIN' ? adminQuery : role === 'TEACHER' ? teacherQuery : parentQuery;
    const { data: notices, isLoading } = query;
    const deleteMutation = useDeleteNotice();

    const latestNotices = (notices || []).slice(0, 3);
    
    // Determine the route based on role
    const route = role === 'ADMIN' 
        ? ROUTES.NOTICE_BOARD 
        : role === 'TEACHER' 
            ? ROUTES.TEACHER_NOTICE_BOARD 
            : ROUTES.PARENT_NOTICE_BOARD;

    if (isLoading) {
        return (
            <Card className="h-full border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 font-normal">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-none shadow-lg overflow-hidden flex flex-col transition-all group hover:shadow-xl bg-card">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent pb-4 border-b border-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Megaphone className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-bold">Latest Notices</CardTitle>
                    </div>
                    <Link href={route}>
                        <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors gap-1">
                            View All <ChevronRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
                {latestNotices.length > 0 ? (
                    <div className="divide-y divide-muted/10">
                        {latestNotices.map((notice, idx) => (
                            <motion.div
                                key={notice.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Link 
                                    href={role === 'ADMIN' 
                                        ? `${ROUTES.NOTICE_BOARD}?noticeId=${notice.id}${notice.target_audience !== 'ALL' ? `&tab=${notice.target_audience}` : ''}`
                                        : `${route}?noticeId=${notice.id}`
                                    }
                                    className="block p-4 hover:bg-muted/20 transition-all group/item border-l-2 border-transparent hover:border-primary/50"
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-1 flex-shrink-0">
                                            {notice.title.includes('Leave') || notice.title.includes('📋') 
                                                ? <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center"><CalendarIcon className="h-3.5 w-3.5 text-amber-600" /></div>
                                                : <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center"><Bell className="h-3.5 w-3.5 text-blue-600" /></div>
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h4 className="text-sm font-bold truncate group-hover/item:text-primary transition-colors">{notice.title}</h4>
                                                    {role === 'ADMIN' && (
                                                        <div className="shrink-0 flex items-center h-3.5 w-3.5 justify-center rounded-full bg-primary/10 border border-primary/20">
                                                            {(() => {
                                                                const Icon = AUDIENCE_ICONS[notice.target_audience];
                                                                return <Icon className="h-2 w-2 text-primary" />;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                                                {notice.body}
                                            </p>
                                        </div>

                                        {role === 'ADMIN' && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete &quot;{notice.title}&quot;?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                onClick={() => {
                                                                    deleteMutation.mutate(notice.id, {
                                                                        onSuccess: () => toast.success('Notice deleted'),
                                                                        onError: (err) => toast.error(err.message || 'Failed to delete'),
                                                                    });
                                                                }}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Megaphone className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">No notices posted yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[180px]">Announcements and updates will appear here.</p>
                    </div>
                )}
                
                {role === 'ADMIN' && (
                    <div className="p-3 mt-auto border-t border-muted/10 bg-muted/5">
                        <Link href={route}>
                            <Button className="w-full h-9 rounded-xl font-bold text-xs gap-2 shadow-sm shadow-primary/20">
                                <Megaphone className="h-3.5 w-3.5" /> Post New Notice
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
