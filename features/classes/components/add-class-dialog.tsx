'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classFormSchema, type ClassFormData } from '@/features/classes/schemas/class.schema';
import { useCreateClass } from '@/features/classes/hooks/use-classes';
import { useGetStaff } from '@/features/staff/api/use-get-staff';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    const { data: staff, isLoading: isStaffLoading } = useGetStaff();

    const form = useForm<ClassFormData>({
        resolver: zodResolver(classFormSchema),
        defaultValues: {
            name: '',
            section: '',
            class_teacher_id: null,
            is_primary: false,
        },
    });

    async function onSubmit(values: ClassFormData) {
        // Ensure class_teacher_id is null if it's an empty string or undefined
        const formattedValues = {
            ...values,
            section: values.section?.trim() || null,
            class_teacher_id: values.class_teacher_id ?? null,
            is_primary: values.is_primary ?? false,
        };

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
                            name="class_teacher_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Class Teacher (In-charge)</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={isStaffLoading ? "Loading staff..." : "Select a teacher"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {staff?.map((s) => (
                                                <SelectItem key={s.id} value={s.id as string}>
                                                    {s.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
