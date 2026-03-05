'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { promoteStudentsSchema, PromoteStudentsData } from '../schemas/student.schema';
import { usePromoteStudents } from '../api/use-promote-students';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { Class } from '@/features/classes/schemas/class.schema';

export function PromoteStudentsDialog() {
    const [open, setOpen] = useState(false);

    const { data: classesData, isLoading: isLoadingClasses } = useClasses();
    const promoteMutation = usePromoteStudents();

    const form = useForm<PromoteStudentsData>({
        resolver: zodResolver(promoteStudentsSchema),
        defaultValues: {
            source_class_id: '',
            destination_class_id: '',
        },
    });

    const onSubmit = (data: PromoteStudentsData) => {
        promoteMutation.mutate({
            fromClassId: data.source_class_id,
            toClassId: data.destination_class_id,
        }, {
            onSuccess: () => {
                toast.success('Students successfully promoted to the new class.');
                setOpen(false);
                form.reset();
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to promote students');
            },
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset();
        }
    };

    const classes = classesData || [];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Promote Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Promote Students</DialogTitle>
                    <DialogDescription>
                        Move all students from one class to another at the end of the academic year. This cannot be undone automatically.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                            <FormField
                                control={form.control}
                                name="source_class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Class</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger disabled={isLoadingClasses}>
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classes.map((cls: Class) => (
                                                    <SelectItem key={cls.id || 'new'} value={cls.id || ''}>
                                                        {cls.name} - Sec {cls.section}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <ArrowRight className="h-5 w-5 mx-auto text-muted-foreground mt-8" />

                            <FormField
                                control={form.control}
                                name="destination_class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>To Class</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger disabled={isLoadingClasses}>
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classes.map((cls: Class) => (
                                                    <SelectItem key={cls.id || 'new'} value={cls.id || ''}>
                                                        {cls.name} - Sec {cls.section}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={promoteMutation.isPending}>
                                {promoteMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Confirm Promotion
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
