'use client';

import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { useClasses } from '@/features/classes/hooks/use-classes';
import { useGetParents } from '@/features/parents/api/use-get-parents';
import { useUpdateStudent } from '../api/use-update-student';
import { storageApi } from '@/features/storage/api/storage.api';
import { Loader2, UploadCloud } from 'lucide-react';

// A lightweight schema for the update form (no document re-upload needed here)
const editStudentSchema = z.object({
    roll_number: z.string().min(1, 'Roll number is required'),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    parent_id: z.string().uuid('Select a valid parent').optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LEAVER']).optional(),
    b_form_url: z.string().url().optional().nullable(),
    date_of_birth: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
    class_id: z.string().uuid('Select a valid class'),
    monthly_fee: z.number().optional().nullable(),
});

type EditStudentForm = z.infer<typeof editStudentSchema>;

type EditStudentProps = {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    student: {
        id: string;
        roll_number: string;
        full_name: string;
        parent_id?: string | null;
        status?: 'ACTIVE' | 'INACTIVE' | 'LEAVER';
        b_form_url?: string | null;
        date_of_birth: string;
        class_id: string;
        monthly_fee?: number | null;
    } | null;
};

export function EditStudentDialog({ isOpen, setIsOpen, student }: EditStudentProps) {
    const [isUploading, setIsUploading] = useState(false);
    const updateMutation = useUpdateStudent();
    const { data: classes, isLoading: isClassesLoading } = useClasses();
    const { data: parents, isLoading: isParentsLoading } = useGetParents();

    const form = useForm<EditStudentForm>({
        resolver: zodResolver(editStudentSchema),
        // 'values' mode syncs the form whenever the `student` prop changes (dynamic pre-fill)
        values: {
            roll_number: student?.roll_number || '',
            full_name: student?.full_name || '',
            parent_id: student?.parent_id || '',
            status: student?.status || 'ACTIVE',
            b_form_url: student?.b_form_url || null,
            date_of_birth: student?.date_of_birth
                ? student.date_of_birth.split('T')[0] // strip time component for date input
                : '',
            class_id: student?.class_id || '',
            monthly_fee: student?.monthly_fee ?? undefined,
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'b_form_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const url = await storageApi.uploadDocument(file);
            form.setValue(fieldName, url);
            toast.success('Document uploaded to vault securely.');
        } catch (error: unknown) {
            toast.error((error as Error).message || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = (data: EditStudentForm) => {
        if (!student?.id) return;

        updateMutation.mutate({ id: student.id, data }, {
            onSuccess: () => {
                toast.success(`${data.full_name}'s record updated.`);
                setIsOpen(false);
            },
            onError: (err: unknown) => {
                toast.error((err as Error).message || 'Failed to update student.');
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
                            name="parent_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Parent</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isParentsLoading}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={isParentsLoading ? 'Loading parents...' : 'Select a parent'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {parents?.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.full_name} ({p.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign Class</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isClassesLoading}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={isClassesLoading ? 'Loading classes...' : 'Select a class'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classes?.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name} - {c.section}
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
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active Student</SelectItem>
                                                <SelectItem value="INACTIVE">Inactive (Suspended)</SelectItem>
                                                <SelectItem value="LEAVER">Leaver (Alumni)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="monthly_fee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Custom Monthly Fee (Optional)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g. 5000" 
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <p className="text-[10px] text-muted-foreground font-medium italic">
                                        * This will override the class tuition fee.
                                    </p>
                                </FormItem>
                            )}
                        />

                        {/* Document Vault Upload */}
                        <div className="border rounded-md p-4 bg-muted/40 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UploadCloud className="w-4 h-4 text-primary" />
                                Update Document Vault (B-Form)
                            </div>
                            <Input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => handleFileUpload(e, 'b_form_url')}
                                disabled={isUploading}
                                className="text-xs"
                            />
                            {form.watch('b_form_url') && (
                                <p className="text-xs text-green-600 font-medium tracking-tight">✓ Document securely stored in vault.</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={updateMutation.isPending || isUploading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending || isUploading}>
                                {updateMutation.isPending || isUploading ? (
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
