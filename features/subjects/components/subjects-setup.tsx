'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, Loader2 } from 'lucide-react';

import { useGetSubjects } from '../hooks/use-get-subjects';
import { useCreateSubject } from '../hooks/use-create-subject';
import { useDeleteSubject } from '../hooks/use-delete-subject';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const subjectSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

export function SubjectsSetup() {
    const { data: subjects, isLoading } = useGetSubjects();
    const createMutation = useCreateSubject();
    const deleteMutation = useDeleteSubject();

    const [open, setOpen] = useState(false);

    const form = useForm<SubjectFormValues>({
        resolver: zodResolver(subjectSchema),
        defaultValues: { name: '', code: '' },
    });

    const onSubmit = (values: SubjectFormValues) => {
        createMutation.mutate(
            { name: values.name, code: values.code || null },
            {
                onSuccess: () => {
                    toast.success('Subject created successfully.');
                    form.reset();
                    setOpen(false);
                },
                onError: (error: unknown) => {
                    toast.error((error as Error).message || 'Failed to create subject.');
                }
            }
        );
    };

    const handleDelete = (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This will remove it from all timetables.`)) return;

        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('Subject deleted.'),
            onError: (error: unknown) => toast.error((error as Error).message || 'Failed to delete subject.'),
        });
    };

    return (
        <Card className="shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Global Subjects
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Manage all subjects taught across the school.</p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" /> Add Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Subject</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subject Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Mathematics" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subject Code (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. MATH-101" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end pt-4">
                                        <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Subject
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="h-32 flex items-center justify-center border rounded-lg bg-muted/10 animate-pulse text-sm text-muted-foreground">Loading subjects...</div>
                ) : !subjects || subjects.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg bg-muted/10 text-muted-foreground text-sm">
                        No subjects found. Create your first subject to get started.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {subjects.map(subject => (
                            <div key={subject.id} className="flex flex-col justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                                <div>
                                    <h3 className="font-medium text-sm">{subject.name}</h3>
                                    {subject.code && <span className="text-xs text-muted-foreground mt-1 inline-block px-2 py-0.5 bg-muted rounded-full">{subject.code}</span>}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleDelete(subject.id, subject.name)}
                                        disabled={deleteMutation.isPending}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
