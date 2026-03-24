'use client';

import { Bell, Check, Info, AlertTriangle, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { Trash2 } from 'lucide-react';
import {
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    useNotificationsRealtime,
    useDeleteNotification,
    useDeleteAllNotifications,
    type Notification,
    type NotificationType,
} from '@/features/notifications/api/use-notifications';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { useInfiniteNotifications } from '@/features/notifications/api/use-infinite-notifications';

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
    INFO: Info,
    WARNING: AlertTriangle,
    SUCCESS: CheckCircle,
    ERROR: AlertCircle,
};

const TYPE_COLOR: Record<NotificationType, string> = {
    INFO: 'text-blue-500',
    WARNING: 'text-amber-500',
    SUCCESS: 'text-green-500',
    ERROR: 'text-red-500',
};

const TYPE_DOT: Record<NotificationType, string> = {
    INFO: 'bg-blue-500',
    WARNING: 'bg-amber-500',
    SUCCESS: 'bg-green-500',
    ERROR: 'bg-red-500',
};

export function NotificationBell() {
    const router = useRouter();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteNotifications(20);
    const notifications = data?.pages.flat() ?? [];
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();
    const deleteMutation = useDeleteNotification();
    const deleteAllMutation = useDeleteAllNotifications();
    const { data: profile } = useAuthProfile();

    const isAdmin = profile?.role === 'ADMIN';

    // Mount realtime subscription — keeps queries in sync on INSERT/UPDATE
    useNotificationsRealtime();

    const unreadCount = notifications?.filter((n: Notification) => !n.is_read).length ?? 0;

    const handleClick = (id: string, isRead: boolean, link: string | null) => {
        if (!isRead) markRead.mutate(id);
        if (link) router.push(link);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-500 animate-pulse"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold text-sm">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-2 text-xs font-medium text-muted-foreground">
                                ({unreadCount} unread)
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={() => markAllRead.mutate()}
                            >
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                        {isAdmin && notifications.length > 0 && (
                            <button
                                className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium"
                                onClick={() => deleteAllMutation.mutate()}
                                disabled={deleteAllMutation.isPending}
                            >
                                <Trash2 className="w-3 h-3" /> {deleteAllMutation.isPending ? 'Clearing...' : 'Clear All'}
                            </button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[340px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full py-12">
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        </div>
                    ) : !notifications || notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                            <Bell className="h-8 w-8 text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">No notifications yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification: Notification) => {
                                const type = notification.type ?? 'INFO';
                                const Icon = TYPE_ICON[type as NotificationType] ?? Info;
                                const iconColor = TYPE_COLOR[type as NotificationType] ?? 'text-blue-500';
                                const dotColor = TYPE_DOT[type as NotificationType] ?? 'bg-blue-500';

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleClick(notification.id, notification.is_read, notification.link)}
                                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 shrink-0">
                                                <Icon className={`h-4 w-4 ${iconColor}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    {!notification.is_read && (
                                                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                                                    )}
                                                    <p className="text-xs font-semibold text-foreground truncate">
                                                        {notification.title}
                                                    </p>
                                                    {notification.link && (
                                                        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMutation.mutate(notification.id);
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    className="shrink-0 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-2"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {hasNextPage && (
                                <button
                                    className="w-full py-2 text-xs text-primary hover:underline disabled:opacity-50"
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage ? 'Loading more…' : 'Load more'}
                                </button>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
