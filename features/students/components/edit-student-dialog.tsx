'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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
import { Button } from '@/components/ui/button';

import { useClasses } from '@/features/classes/hooks/use-classes';
import { useUpdateStudent } from '../api/use-update-student';

// A lightweight schema for the update form (no document re-upload needed here)
const editStudentSchema = z.object({
    roll_number: z.string().min(1, 'Roll number is required'),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    date_of_birth: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
    class_id: z.string().uuid('Select a valid class'),
});

type EditStudentForm = z.infer<typeof editStudentSchema>;

type EditStudentProps = {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    student: {
        id: string;
        roll_number: string;
        full_name: string;
        date_of_birth: string;
        class_id: string;
    } | null;
};

export function EditStudentDialog({ isOpen, setIsOpen, student }: EditStudentProps) {
    const updateMutation = useUpdateStudent();
    const { data: classes, isLoading: isClassesLoading } = useClasses();

    const form = useForm<EditStudentForm>({
        resolver: zodResolver(editStudentSchema),
        // 'values' mode syncs the form whenever the `student` prop changes (dynamic pre-fill)
        values: {
            roll_number: student?.roll_number || '',
            full_name: student?.full_name || '',
            date_of_birth: student?.date_of_birth
                ? student.date_of_birth.split('T')[0] // strip time component for date input
                : '',
            class_id: student?.class_id || '',
        },
    });

    const onSubmit = (data: EditStudentForm) => {
        if (!student?.id) return;

        updateMutation.mutate({ id: student.id, data }, {
            onSuccess: () => {
                toast.success(`${data.full_name}'s record updated.`);
                setIsOpen(false);
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to update student.');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Edit Student Record</DialogTitle>
                    <DialogDescription>
                        Update details for <strong>{student?.full_name}</strong>. Document vault files are not changed here.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="roll_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Roll Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 2026-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date_of_birth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Full Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="class_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Class</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                            disabled={isClassesLoading}
                                        >
                                            <option value="" disabled>
                                                {isClassesLoading ? 'Loading classes...' : 'Select a class'}
                                            </option>
                                            {classes?.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} - {c.section}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={updateMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
