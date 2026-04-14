'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, UserPlus, UploadCloud } from 'lucide-react';
import { storageApi } from '@/features/storage/api/storage.api';
import { ImageCropper } from '@/components/ui/image-cropper';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import { base64ToFile } from '@/utils/file-utils';
import Image from 'next/image';

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
    const [isUploading, setIsUploading] = useState(false);
    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempCropImage, setTempCropImage] = useState<string>('');
    
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
            resume_url: null,
            avatar_url: null,
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'resume_url' | 'avatar_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (fieldName === 'avatar_url') {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setTempCropImage(reader.result?.toString() || "");
                setCropModalOpen(true);
            });
            reader.readAsDataURL(file);
            return;
        }

        try {
            setIsUploading(true);
            const url = await storageApi.uploadDocument(file);
            form.setValue(fieldName, url as any);
            toast.success('Document uploaded to vault securely.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCropComplete = async (base64Image: string) => {
        try {
            setIsUploading(true);
            const fileName = `staff_photo_${Date.now()}.png`;
            const file = base64ToFile(base64Image, fileName);
            const url = await storageApi.uploadDocument(file, 'documents', 'vault/staff');
            form.setValue('avatar_url', url as any);
            toast.success('Photo cropped and uploaded to staff vault.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload photo.');
        } finally {
            setIsUploading(false);
        }
    };

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
                                                <Input
                                                    type="number"
                                                    placeholder="5000"
                                                    {...field}
                                                    onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Document Vault Upload */}
                        <div className="border rounded-md p-4 bg-muted/40 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UploadCloud className="w-4 h-4 text-primary" />
                                Staff Profile Photo
                            </div>
                            <div className="flex items-center gap-4">
                                {form.watch('avatar_url') && (
                                    <ImagePreviewDialog 
                                        src={form.watch('avatar_url') as string} 
                                        title={`${form.watch('full_name') || 'New Staff'} - Photo`}
                                        description="Staff Profile Picture"
                                    >
                                        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-full border shadow-sm bg-background cursor-pointer">
                                            <Image 
                                                src={form.watch('avatar_url') as string} 
                                                alt="Staff Preview" 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </div>
                                    </ImagePreviewDialog>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'avatar_url')}
                                    disabled={isUploading}
                                    className="text-xs flex-1"
                                />
                            </div>
                        </div>

                        {/* Document Vault Upload */}
                        <div className="border rounded-md p-4 bg-muted/40 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UploadCloud className="w-4 h-4 text-primary" />
                                Document Vault (Resume/CV)
                            </div>
                            <Input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => handleFileUpload(e, 'resume_url')}
                                disabled={isUploading}
                                className="text-xs"
                            />
                            {form.watch('resume_url') && (
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-green-600 font-medium tracking-tight">✓ Document securely stored in vault.</p>
                                    <ImagePreviewDialog 
                                        src={form.watch('resume_url') as string} 
                                        title={`${form.watch('full_name')} - Resume`}
                                        description="Staff Qualification Proof"
                                    >
                                        <Button type="button" variant="link" size="sm" className="h-6 text-[10px] font-black uppercase text-primary px-0 italic">
                                            Preview
                                        </Button>
                                    </ImagePreviewDialog>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={createMutation.isPending || isUploading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || isUploading}>
                                {createMutation.isPending || isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Register Staff'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
                <ImageCropper 
                    open={cropModalOpen}
                    onOpenChange={setCropModalOpen}
                    imageSrc={tempCropImage}
                    onCropComplete={handleCropComplete}
                />
            </DialogContent>
        </Dialog>
    );
}
