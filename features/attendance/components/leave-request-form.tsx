'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createLeaveRequest } from '@/features/attendance/actions/leave-actions';

const formSchema = z.object({
    student_id: z.string().min(1, 'Please select a student'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters'),
});

type FormValues = z.infer<typeof formSchema>;

interface LeaveRequestFormProps {
    students: { id: string; full_name: string; class?: { name: string; section: string } }[];
    onSuccess?: () => void;
}

export function LeaveRequestForm({ students, onSuccess }: LeaveRequestFormProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            student_id: '',
            start_date: today,
            end_date: today,
            reason: '',
        },
    });

    const startDate = form.watch('start_date');

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const res = await createLeaveRequest(values);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            toast.success('Leave request submitted successfully');
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
            form.reset();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to submit request');
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });

    const onSubmit = (values: FormValues) => {
        setIsSubmitting(true);
        mutation.mutate(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="student_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select Student</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a child" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.full_name} {student.class ? `(${student.class.name}-${student.class.section})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} min={startDate || new Date().toISOString().split('T')[0]} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Leave</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Please explain the reason for leave..."
                                    className="resize-none min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting Request...
                        </>
                    ) : (
                        'Submit Leave Request'
                    )}
                </Button>
            </form>
        </Form>
    );
}

