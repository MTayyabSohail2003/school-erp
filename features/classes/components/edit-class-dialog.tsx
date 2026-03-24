'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classFormSchema, type ClassFormData } from '@/features/classes/schemas/class.schema';
import { useUpdateClass, useClasses } from '@/features/classes/hooks/use-classes';
import { type ClassRecord } from '@/features/classes/api/classes.api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { Loader2 } from 'lucide-react';

interface EditClassDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    classData: ClassRecord | null;
}

export function EditClassDialog({ isOpen, setIsOpen, classData }: EditClassDialogProps) {
    const updateClassMutation = useUpdateClass();
    const { data: existingClasses } = useClasses();

    const form = useForm<ClassFormData>({
        resolver: zodResolver(classFormSchema),
        defaultValues: {
            name: '',
            section: '',
            is_primary: false,
        },
    });

    useEffect(() => {
        if (classData && isOpen) {
            form.reset({
                name: classData.name,
                section: classData.section || '',
                is_primary: classData.is_primary,
            });
        }
    }, [classData, isOpen, form]);

    async function onSubmit(values: ClassFormData) {
        if (!classData) return;

        const formattedValues = {
            ...values,
            section: values.section?.trim() || null,
            is_primary: values.is_primary ?? false,
        };

        // Guard: Prevent duplicate class name + section combination (ignoring the current record)
        const isDuplicate = existingClasses?.some(c => 
            c.id !== classData.id &&
            c.name.toLowerCase() === formattedValues.name.trim().toLowerCase() && 
            (c.section || '').toLowerCase() === (formattedValues.section || '').toLowerCase()
        );

        if (isDuplicate) {
            toast.error(`Class ${formattedValues.name}${formattedValues.section ? ` - ${formattedValues.section}` : ''} already exists!`);
            return;
        }

        updateClassMutation.mutate(
            { id: classData.id, updates: formattedValues },
            {
                onSuccess: () => {
                    setIsOpen(false);
                    form.reset();
                },
            }
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Edit Class</DialogTitle>
                    <DialogDescription>
                        Modify the details for {classData?.name}.
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
                                            onBlur={() => {
                                                const trimmed = field.value.trim();
                                                if (/^\d+$/.test(trimmed)) {
                                                    field.onChange(`Class ${trimmed}`);
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
                                disabled={updateClassMutation.isPending}
                                className="w-full sm:w-auto"
                            >
                                {updateClassMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
