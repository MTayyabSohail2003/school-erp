'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentFormSchema, type StudentFormData } from '@/features/students/schemas/student.schema';
import { useCreateStudent } from '@/features/students/hooks/use-students';
import { useGetParents } from '@/features/parents/api/use-get-parents';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { storageApi } from '@/features/storage/api/storage.api';
import { createParentAction } from '@/features/parents/api/create-parent.action';
import { useQueryClient } from '@tanstack/react-query';
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
import { Loader2, Plus, UploadCloud, UserPlus, X } from 'lucide-react';

// Sub-component for inline parent creation
function CreateParentForm({
    onSuccess,
    onCancel
}: {
    onSuccess: (parentId: string) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', email: '', phone_number: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await createParentAction(formData);
            if (!res.success) throw new Error(res.error);
            toast.success(res.message);
            if (res.parent?.id) onSuccess(res.parent.id);
        } catch (error: unknown) {
            toast.error((error as Error).message || 'Failed to create parent');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="border rounded-md p-4 bg-muted/40 space-y-3 relative mt-2">
            <button type="button" onClick={onCancel} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
            </button>
            <h4 className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Create New Parent
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <FormLabel className="text-xs">Full Name</FormLabel>
                    <Input className="h-8 text-xs" required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                    <FormLabel className="text-xs">Email</FormLabel>
                    <Input className="h-8 text-xs" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                    <FormLabel className="text-xs">Phone Number</FormLabel>
                    <Input className="h-8 text-xs" required value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                </div>
                <div className="space-y-1">
                    <FormLabel className="text-xs">Password</FormLabel>
                    <Input className="h-8 text-xs" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
            </div>
            <Button type="button" onClick={handleSubmit} disabled={isLoading} size="sm" className="w-full h-8 text-xs mt-2">
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : 'Register Parent'}
            </Button>
        </div>
    );
}

export function AddStudentDialog() {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const createStudentMutation = useCreateStudent();
    const { data: classes, isLoading: isClassesLoading } = useClasses();
    const { data: parents, isLoading: isParentsLoading } = useGetParents();
    const queryClient = useQueryClient();

    const [isCreatingParent, setIsCreatingParent] = useState(false);

    const form = useForm<StudentFormData>({
        resolver: zodResolver(studentFormSchema),
        defaultValues: {
            roll_number: '',
            full_name: '',
            parent_id: '',
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
        } catch (error: unknown) {
            toast.error((error as Error).message || 'Failed to upload document.');
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
            onError: (error: unknown) => {
                toast.error((error as Error).message || 'Failed to register student.');
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
                            name="parent_id"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Assign Parent</FormLabel>
                                        {!isCreatingParent && (
                                            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary px-2" onClick={() => setIsCreatingParent(true)}>
                                                <Plus className="h-3 w-3 mr-1" /> New Parent
                                            </Button>
                                        )}
                                    </div>
                                    <FormControl>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                            value={field.value || ''}
                                            disabled={isParentsLoading || isCreatingParent}
                                        >
                                            <option value="" disabled>
                                                {isParentsLoading ? 'Loading parents...' : 'Select a parent'}
                                            </option>
                                            {parents?.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.full_name} ({p.email})
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                    {isCreatingParent && (
                                        <CreateParentForm
                                            onCancel={() => setIsCreatingParent(false)}
                                            onSuccess={(newParentId) => {
                                                queryClient.invalidateQueries({ queryKey: ['parents'] });
                                                form.setValue('parent_id', newParentId);
                                                setIsCreatingParent(false);
                                            }}
                                        />
                                    )}
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
