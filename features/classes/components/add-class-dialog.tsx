'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classFormSchema, type ClassFormData } from '@/features/classes/schemas/class.schema';
import { useCreateClass, useClasses } from '@/features/classes/hooks/use-classes';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

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
    const { data: existingClasses } = useClasses();

    const form = useForm<ClassFormData>({
        resolver: zodResolver(classFormSchema),
        defaultValues: {
            name: '',
            section: '',
            class_teacher_id: null,
            is_primary: false,
        },
    });

    // Automated Primary Mode Detection
    const classNameValue = form.watch('name');
    useEffect(() => {
        const lowerName = classNameValue.toLowerCase();
        const primaryKeywords = ['nursery', 'prep', '1', '2', '3', '4'];
        const secondaryKeywords = ['5', '6', '7', '8', '9', '10'];

        const hasPrimary = primaryKeywords.some(key => {
            // Check if it's the exact number or starts with "class [number]"
            const regex = new RegExp(`(^|\\s)${key}(\\s|$)`, 'i');
            return regex.test(lowerName);
        });

        const hasSecondary = secondaryKeywords.some(key => {
            const regex = new RegExp(`(^|\\s)${key}(\\s|$)`, 'i');
            return regex.test(lowerName);
        });

        if (hasPrimary && !hasSecondary) {
            form.setValue('is_primary', true);
        } else if (hasSecondary) {
            form.setValue('is_primary', false);
        }
    }, [classNameValue, form]);

    async function onSubmit(values: ClassFormData) {
        // Ensure class_teacher_id is null if it's an empty string or undefined
        const formattedValues = {
            ...values,
            name: values.name.trim().toUpperCase(),
            section: values.section.trim().toUpperCase(),
            class_teacher_id: values.class_teacher_id ?? null,
            is_primary: values.is_primary ?? false,
        };

        // Guard: Prevent duplicate class name + section combination
        const isDuplicate = existingClasses?.some(c => 
            c.name.toLowerCase() === formattedValues.name.trim().toLowerCase() && 
            (c.section || '').toLowerCase() === (formattedValues.section || '').toLowerCase()
        );

        if (isDuplicate) {
            toast.error(`Class ${formattedValues.name}${formattedValues.section ? ` - ${formattedValues.section}` : ''} already exists!`);
            return;
        }

        createClassMutation.mutate(formattedValues, {
            onSuccess: () => {
                toast.success(`Class ${values.name}${values.section ? ` - ${values.section}` : ''} added successfully.`);
                setOpen(false);
                form.reset();
            },
            onError: (error: Error) => {
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
                                        <Input 
                                            placeholder="e.g. 10 or Class 10" 
                                            {...field} 
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            onBlur={() => {
                                                const trimmed = field.value.trim().toUpperCase();
                                                if (/^\d+$/.test(trimmed)) {
                                                    field.onChange(`CLASS ${trimmed}`);
                                                }
                                            }}
                                        />
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
                                        <Input 
                                            placeholder="e.g. A" 
                                            {...field} 
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

 
                        <FormField
                            control={form.control}
                            name="is_primary"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1">
                                        <FormLabel>
                                            Primary Class Mode
                                        </FormLabel>
                                        <div className="text-[12px] text-muted-foreground">
                                            Enable easy timetable management for Nursery to 4th.
                                        </div>
                                    </div>
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
