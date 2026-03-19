'use client';

import { useEffect, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Megaphone, Send, Trash2, Loader2, Users, GraduationCap,
    Globe, ClipboardList
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import {
    useNotices, useDeleteNotice, useNoticesRealtime,
    type NoticeAudience, NOTICES_KEY, type Notice
} from '../api/use-notices';
import { ROUTES } from '@/constants/globals';
import { postNotice } from '../actions/post-notice.action';
import { postTodayLeaveSummary } from '../actions/post-leave-summary.action';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { PageTransition } from '@/components/ui/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { useBulkDeleteNotices } from '../api/use-notices';

const noticeSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    body: z.string().min(10, 'Notice body must be at least 10 characters'),
    target_audience: z.enum(['TEACHER', 'PARENT', 'ALL']),
});

type NoticeFormData = z.infer<typeof noticeSchema>;

const AUDIENCE_META: Record<NoticeAudience, { label: string; icon: React.ElementType; color: string }> = {
    TEACHER: { label: 'Teachers', icon: GraduationCap, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    PARENT: { label: 'Parents', icon: Users, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    ALL: { label: 'Everyone', icon: Globe, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

function AudienceBadge({ audience }: { audience: NoticeAudience }) {
    const { label, icon: Icon, color } = AUDIENCE_META[audience];
    return (
        <Badge variant="outline" className={`gap-1 text-[10px] font-medium ${color}`}>
            <Icon className="h-2.5 w-2.5" />
            {label}
        </Badge>
    );
}

export function NoticeBoardPage() {
    useNoticesRealtime();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'ALL';
    const { data: profile } = useAuthProfile();
    const router = useRouter();
    const isAdmin = profile?.role === 'ADMIN';

    // Safety redirect for non-admins stumbling onto the admin settings page
    useEffect(() => {
        if (profile && !isAdmin) {
            const destination = profile.role === 'TEACHER'
                ? ROUTES.TEACHER_NOTICE_BOARD
                : ROUTES.PARENT_NOTICE_BOARD;
            router.push(destination);
        }
    }, [profile, isAdmin, router]);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const dateQuery = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;

    const { data: notices, isLoading } = useNotices(dateQuery);
    const deleteMutation = useDeleteNotice();
    const [isComposing, setIsComposing] = useState(false);
    const [isPosting, startPosting] = useTransition();
    const [isPostingLeave, startPostingLeave] = useTransition();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const bulkDeleteMutation = useBulkDeleteNotices();

    const form = useForm<NoticeFormData>({
        resolver: zodResolver(noticeSchema),
        defaultValues: { title: '', body: '', target_audience: 'ALL' },
    });

    const queryClient = useQueryClient();
    const noticeId = searchParams.get('noticeId');

    // Handle deep-linking to specific notice
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

    const onSubmit = (data: NoticeFormData) => {
        startPosting(async () => {
            const result = await postNotice(data);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success('Notice posted & notifications sent!');
                queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
                form.reset();
                setIsComposing(false);
            }
        });
    };

    const handlePostLeaveSummary = () => {
        startPostingLeave(async () => {
            const result = await postTodayLeaveSummary();
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success(`Leave summary posted! ${result.count} requests included.`);
                queryClient.invalidateQueries({ queryKey: NOTICES_KEY });
            }
        });
    };

    const filteredNotices = notices?.filter(n =>
        activeTab === 'ALL' ? true : n.target_audience === activeTab || n.target_audience === 'ALL'
    );

    return (
        <PageTransition>
            <div className="space-y-6 max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
                            <p className="text-sm text-muted-foreground">
                                Broadcast announcements to Teachers, Parents, or both
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal h-10 px-3 min-w-[160px]",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
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

                        {isAdmin && (
                            <>
                                {/* Leave Summary Button */}
                                <Button
                                    variant="outline"
                                    className="gap-2 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 h-10"
                                    onClick={handlePostLeaveSummary}
                                    disabled={isPostingLeave}
                                >
                                    {isPostingLeave
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <ClipboardList className="h-4 w-4" />}
                                    <span className="hidden sm:inline">Post Today&apos;s Leaves</span>
                                </Button>
                                <Button
                                    onClick={() => setIsComposing(v => !v)}
                                    variant={isComposing ? 'outline' : 'default'}
                                    className="gap-2 h-10"
                                >
                                    <Megaphone className="h-4 w-4" />
                                    {isComposing ? 'Cancel' : 'Post Notice'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Bulk Delete Header - Admin Only */}
                {isAdmin && selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                {selectedIds.length} selected
                            </Badge>
                            <p className="text-sm font-medium text-primary/80">Manage multiple notices</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds([])}
                                className="h-8 text-xs font-semibold"
                            >
                                Deselect All
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 gap-2 shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Selected
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                            <Trash2 className="h-5 w-5" />
                                            Bulk Delete Notices
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to permanently delete <strong>{selectedIds.length}</strong> selected notices? This action will remove them for all users and cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-4">
                                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl px-6"
                                            onClick={() => {
                                                bulkDeleteMutation.mutate(selectedIds, {
                                                    onSuccess: () => {
                                                        toast.success(`${selectedIds.length} notices deleted.`);
                                                        setSelectedIds([]);
                                                    },
                                                });
                                            }}
                                        >
                                            Yes, Bulk Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </motion.div>
                )}

                {/* Compose Panel */}
                <AnimatePresence>
                    {isComposing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-primary">Compose New Notice</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="title" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Title</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. School will be closed tomorrow" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="target_audience" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Send To</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select audience" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="TEACHER">
                                                                    <div className="flex items-center gap-2">
                                                                        <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
                                                                        Teachers Only
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="PARENT">
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="h-3.5 w-3.5 text-blue-500" />
                                                                        Parents Only
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="ALL">
                                                                    <div className="flex items-center gap-2">
                                                                        <Globe className="h-3.5 w-3.5 text-green-500" />
                                                                        Everyone
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <FormField control={form.control} name="body" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Message</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Write the full notice details here…"
                                                            className="min-h-[100px] resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <div className="flex justify-end">
                                                <Button type="submit" disabled={isPosting} className="gap-2">
                                                    {isPosting
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Send className="h-4 w-4" />}
                                                    Broadcast Notice
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filter Tabs - Only for Admin */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    {isAdmin && (
                        <TabsList className="grid grid-cols-3 w-full max-w-sm">
                            <TabsTrigger value="ALL">All</TabsTrigger>
                            <TabsTrigger value="TEACHER">Teachers</TabsTrigger>
                            <TabsTrigger value="PARENT">Parents</TabsTrigger>
                        </TabsList>
                    )}

                    {['ALL', 'TEACHER', 'PARENT'].map(tab => (
                        <TabsContent key={tab} value={tab} className="mt-4">
                            <NoticeList
                                notices={filteredNotices ?? []}
                                isLoading={isLoading}
                                isAdmin={isAdmin}
                                onSelect={setSelectedNotice}
                                selectedIds={selectedIds}
                                onToggleSelect={(id) => {
                                    setSelectedIds(prev =>
                                        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                    );
                                }}
                                onToggleSelectAll={(checked) => {
                                    if (checked && filteredNotices) {
                                        setSelectedIds(filteredNotices.map(n => n.id));
                                    } else {
                                        setSelectedIds([]);
                                    }
                                }}
                                onDelete={(id) => deleteMutation.mutate(id, {
                                    onSuccess: () => toast.success('Notice deleted.'),
                                })}
                            />
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Notice Detail Dialog - Lifted up */}
                <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
                    <DialogContent className="max-w-2xl bg-card border-primary/20">
                        <DialogHeader className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                                    <Megaphone className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                    <DialogTitle className="text-xl font-bold leading-tight">
                                        {selectedNotice?.title}
                                    </DialogTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <AudienceBadge audience={selectedNotice?.target_audience || 'ALL'} />
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

type NoticeListProps = {
    notices: Notice[];
    isLoading: boolean;
    isAdmin: boolean;
    onDelete: (id: string) => void;
    onSelect: (notice: Notice) => void;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: (checked: boolean) => void;
};

function NoticeList({ 
    notices, isLoading, isAdmin, onDelete, onSelect, 
    selectedIds, onToggleSelect, onToggleSelectAll 
}: NoticeListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
        );
    }

    if (!notices || notices.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="font-medium text-muted-foreground">No notices yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Post a notice to broadcast it to the selected audience.</p>
                </CardContent>
            </Card>
        );
    }

    const allSelected = notices.length > 0 && selectedIds.length === notices.length;

    return (
        <div className="space-y-3">
            {isAdmin && notices.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-1">
                    <Checkbox 
                        id="select-all" 
                        checked={allSelected} 
                        onCheckedChange={(checked) => onToggleSelectAll(!!checked)}
                    />
                    <label 
                        htmlFor="select-all" 
                        className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                    >
                        Select all notices in this view
                    </label>
                </div>
            )}
            {notices.map((notice, idx) => {
                const isSelected = selectedIds.includes(notice.id);
                return (
                    <motion.div
                        key={notice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }} // Faster stagger
                    >
                        <Card
                            className={cn(
                                "hover:shadow-md transition-all cursor-pointer border-muted/20 hover:border-primary/40 group/card relative",
                                isSelected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                            )}
                            onClick={() => onSelect(notice)}
                        >
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start gap-4">
                                    {isAdmin && (
                                        <div 
                                            className="pt-1.5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleSelect(notice.id);
                                            }}
                                        >
                                            <Checkbox 
                                                checked={isSelected}
                                                className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full shrink-0 animate-pulse-slow",
                                                isSelected ? "bg-primary" : "bg-muted-foreground/40"
                                            )} />
                                            <h3 className="font-semibold text-sm group-hover/card:text-primary transition-colors">{notice.title}</h3>
                                            <AudienceBadge audience={notice.target_audience} />
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed pl-4 line-clamp-2">
                                            {notice.body}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-2 pl-4">
                                            {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently remove &quot;{notice.title}&quot; from the board.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => onDelete(notice.id)}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
