'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

import { staffUpdateSchema, type StaffUpdateData } from '../schemas/staff.schema';
import { useUpdateStaff } from '../api/use-update-staff';

// We map out the data we expect from the staff-table row
type EditStaffProps = {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    staffMember: {
        id: string; // the Auth ID
        full_name: string;
        phone_number?: string | null;
        qualification: string;
        monthly_salary: number;
    } | null;
};

export function EditStaffDialog({ isOpen, setIsOpen, staffMember }: EditStaffProps) {
    const updateMutation = useUpdateStaff();

    const form = useForm({
        resolver: zodResolver(staffUpdateSchema),
        values: {
            full_name: staffMember?.full_name || '',
            phone_number: staffMember?.phone_number || '',
            qualification: staffMember?.qualification || '',
            monthly_salary: staffMember?.monthly_salary || 0,
        },
    });

    const onSubmit = (data: StaffUpdateData) => {
        if (!staffMember?.id) return;

        updateMutation.mutate({ id: staffMember.id, data }, {
            onSuccess: () => {
                toast.success('Staff profile updated.');
                setIsOpen(false);
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to update staff member.');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Staff Profile</DialogTitle>
                    <DialogDescription>
                        Update details for {staffMember?.full_name}. Login email cannot be changed here.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+1234567890" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="qualification"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Qualification</FormLabel>
                                    <FormControl>
                                        <Input placeholder="MSc Mathematics" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="monthly_salary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monthly Salary ($)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            {...field}
                                            onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                                        />
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
