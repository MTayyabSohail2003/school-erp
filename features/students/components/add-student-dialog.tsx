'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentFormSchema, type StudentFormData } from '@/features/students/schemas/student.schema';
import { useCreateStudent } from '@/features/students/hooks/use-students';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { storageApi } from '@/features/storage/api/storage.api';
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
import { Loader2, Plus, UploadCloud } from 'lucide-react';

export function AddStudentDialog() {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const createStudentMutation = useCreateStudent();
    const { data: classes, isLoading: isClassesLoading } = useClasses();

    const form = useForm<StudentFormData>({
        resolver: zodResolver(studentFormSchema),
        defaultValues: {
            roll_number: '',
            full_name: '',
            guardian_name: '',
            date_of_birth: '',
            class_id: '',
            b_form_url: null,
            old_cert_url: null,
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'b_form_url' | 'old_cert_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const url = await storageApi.uploadDocument(file);
            form.setValue(fieldName, url);
            toast.success('Document uploaded to vault securely.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    async function onSubmit(values: StudentFormData) {
        createStudentMutation.mutate(values, {
            onSuccess: () => {
                toast.success('Student registered successfully.');
                setOpen(false);
                form.reset();
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to register student.');
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Student
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Register Student</DialogTitle>
                    <DialogDescription>
                        Enter the student details and securely upload their B-Form.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="guardian_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Parent/Guardian Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Ahsan Doe" {...field} />
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
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

                        {/* Document Vault Upload */}
                        <div className="border rounded-md p-4 bg-muted/40 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UploadCloud className="w-4 h-4 text-primary" />
                                Document Vault (B-Form)
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

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={createStudentMutation.isPending || isUploading}
                                className="w-full sm:w-auto"
                            >
                                {createStudentMutation.isPending || isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Registration'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
