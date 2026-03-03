'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

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
import { Button } from '@/components/ui/button';

import { staffFormSchema, type StaffFormData } from '../schemas/staff.schema';
import { useCreateStaff } from '../api/use-create-staff';

export function AddStaffDialog() {
    const [open, setOpen] = useState(false);
    const createMutation = useCreateStaff();

    const form = useForm({
        resolver: zodResolver(staffFormSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone_number: '',
            password: '',
            qualification: '',
            monthly_salary: 0,
        },
    });

    const onSubmit = (data: StaffFormData) => {
        createMutation.mutate(data, {
            onSuccess: () => {
                toast.success('Staff member successfully created.');
                setOpen(false);
                form.reset();
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to create staff member');
            },
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Staff
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Teacher/Staff</DialogTitle>
                    <DialogDescription>
                        Create a secure login account and profile for a new teacher.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                            <h3 className="text-sm font-semibold">Account Details (Login)</h3>
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

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="teacher@school.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Temporary Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="******" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                            <h3 className="text-sm font-semibold">Profile Details</h3>
                            <FormField
                                control={form.control}
                                name="phone_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1234567890" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="qualification"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Qualification</FormLabel>
                                            <FormControl>
                                                <Input placeholder="M.Sc. Mathematics" {...field} />
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
                                                <Input type="number" placeholder="5000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Register Staff
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
