'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, UploadCloud } from 'lucide-react';
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
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
        status?: 'ACTIVE' | 'INACTIVE' | 'LEAVER';
        resume_url?: string | null;
        avatar_url?: string | null;
    } | null;
};

export function EditStaffDialog({ isOpen, setIsOpen, staffMember }: EditStaffProps) {
    const [isUploading, setIsUploading] = useState(false);
    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempCropImage, setTempCropImage] = useState<string>('');
    
    const updateMutation = useUpdateStaff();

    const form = useForm({
        resolver: zodResolver(staffUpdateSchema),
        values: {
            full_name: staffMember?.full_name || '',
            phone_number: staffMember?.phone_number || '',
            qualification: staffMember?.qualification || '',
            monthly_salary: staffMember?.monthly_salary || 0,
            status: (staffMember?.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'LEAVER',
            resume_url: staffMember?.resume_url || null,
            avatar_url: staffMember?.avatar_url || null,
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
            const fileName = `staff_photo_${staffMember?.id || Date.now()}.png`;
            const file = base64ToFile(base64Image, fileName);
            const url = await storageApi.uploadDocument(file, 'documents', 'vault/staff');
            form.setValue('avatar_url', url as any);
            toast.success('Photo cropped and uploaded to staff vault. Save changes to confirm.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload photo.');
        } finally {
            setIsUploading(false);
        }
    };

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

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                                            <SelectItem value="LEAVER">Leaver</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Document Vault Upload */}
                        <div className="border rounded-md p-4 bg-muted/40 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UploadCloud className="w-4 h-4 text-primary" />
                                Update Profile Photo
                            </div>
                            <div className="flex items-center gap-4">
                                {form.watch('avatar_url') && (
                                    <ImagePreviewDialog 
                                        src={form.watch('avatar_url') as string} 
                                        title={`${form.watch('full_name')} - Photo`}
                                        description="Profile Preview"
                                    >
                                        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-full border shadow-sm bg-background cursor-pointer">
                                            <Image 
                                                src={form.watch('avatar_url') as string} 
                                                alt="Staff Portrait" 
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
                                Update Document Vault (Resume/CV)
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
