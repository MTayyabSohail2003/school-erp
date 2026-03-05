'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Megaphone, Send, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useNotices, usePostNotice, useDeleteNotice, useNoticesRealtime } from '../api/use-notices';
import { PageTransition } from '@/components/ui/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const noticeSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    body: z.string().min(10, 'Notice body must be at least 10 characters'),
});

type NoticeFormData = z.infer<typeof noticeSchema>;

export function NoticeBoardPage() {
    // Subscribe to realtime updates
    useNoticesRealtime();

    const { data: notices, isLoading } = useNotices();
    const postMutation = usePostNotice();
    const deleteMutation = useDeleteNotice();

    const [isComposing, setIsComposing] = useState(false);

    const form = useForm<NoticeFormData>({
        resolver: zodResolver(noticeSchema),
        defaultValues: { title: '', body: '' },
    });

    const onSubmit = (data: NoticeFormData) => {
        postMutation.mutate(data, {
            onSuccess: () => {
                toast.success('Notice broadcast to all users!');
                form.reset();
                setIsComposing(false);
            },
            onError: (err) => toast.error(err.message),
        });
    };

    return (
        <PageTransition>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
                            <p className="text-sm text-muted-foreground">Broadcast announcements to all users in real-time</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsComposing(v => !v)} variant={isComposing ? 'outline' : 'default'} className="gap-2">
                        <Megaphone className="h-4 w-4" />
                        {isComposing ? 'Cancel' : 'Post Notice'}
                    </Button>
                </div>

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
                                            <FormField control={form.control} name="title" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Title</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. School will remain closed tomorrow" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
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
                                                <Button type="submit" disabled={postMutation.isPending} className="gap-2">
                                                    {postMutation.isPending
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

                {/* Notices List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                ) : !notices || notices.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-muted-foreground">No notices posted yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">Post a notice to broadcast it to all logged-in users.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {notices.map((notice, idx) => (
                            <motion.div
                                key={notice.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                            >
                                <Card className="hover:shadow-sm transition-shadow">
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                                    <h3 className="font-semibold text-sm truncate">{notice.title}</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed pl-4">{notice.body}</p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-2 pl-4">
                                                    {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently remove &quot;{notice.title}&quot; from the notice board.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => {
                                                                deleteMutation.mutate(notice.id, {
                                                                    onSuccess: () => toast.success('Notice deleted.'),
                                                                });
                                                            }}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
