'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classFormSchema, type ClassFormData } from '@/features/classes/schemas/class.schema';
import { useCreateClass } from '@/features/classes/hooks/use-classes';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';

export function AddClassDialog() {
    const [open, setOpen] = useState(false);
    const createClassMutation = useCreateClass();

    const form = useForm<ClassFormData>({
        resolver: zodResolver(classFormSchema),
        defaultValues: {
            name: '',
            section: '',
        },
    });

    async function onSubmit(values: ClassFormData) {
        createClassMutation.mutate(values, {
            onSuccess: () => {
                toast.success(`Class ${values.name} - ${values.section} added successfully.`);
                setOpen(false);
                form.reset();
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to add class.');
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Add Class</DialogTitle>
                    <DialogDescription>
                        Create a new class and section configuration.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Class Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Class 10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="section"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={createClassMutation.isPending}
                                className="w-full sm:w-auto"
                            >
                                {createClassMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Add Class'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
