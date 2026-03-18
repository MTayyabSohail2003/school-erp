'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
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

import { ImageCropper } from '@/components/ui/image-cropper';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, UploadCloud, UserPlus, X, ChevronRight, ChevronLeft } from 'lucide-react';

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
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    
    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempCropImage, setTempCropImage] = useState<string>('');

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
            status: 'ACTIVE',
            date_of_birth: new Date().toISOString().split('T')[0],
            class_id: '',
            parent_id: '',
            b_form_url: null,
            old_cert_url: null,
            photo_url: null,
            monthly_fee: undefined,
        },
    });

    // Auto-prefix Roll Number based on Class
    const watchedClassId = form.watch('class_id');
    const prevClassId = React.useRef<string>('');

    React.useEffect(() => {
        if (!watchedClassId || watchedClassId === prevClassId.current) return;
        
        const selectedClass = classes?.find(c => c.id === watchedClassId);
        if (selectedClass) {
            const classNum = selectedClass.name.match(/\d+/)?.[0] || selectedClass.name;
            const prefix = `C${classNum}-${selectedClass.section}-`.toUpperCase().replace(/\s+/g, '');
            
            const currentRoll = form.getValues('roll_number') || '';
            // If current roll doesn't start with the new prefix, update it
            // We try to preserve the numeric part if possible
            const existingSuffix = currentRoll.split('-').pop() || '';
            const isJustPrefix = currentRoll.includes('-') && !/\d+$/.test(currentRoll);
            
            form.setValue('roll_number', prefix + (isJustPrefix ? '' : existingSuffix));
        }
        prevClassId.current = watchedClassId;
    }, [watchedClassId, classes, form]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'b_form_url' | 'old_cert_url' | 'photo_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (fieldName === 'photo_url') {
            // Read file for cropping instead of direct upload
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
            form.setValue(fieldName, url);
            toast.success('Document uploaded to vault securely.');
        } catch (error: unknown) {
            toast.error((error as Error).message || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCropComplete = (base64Image: string) => {
        // Direct Base64 save for db scalability instead of bucket upload
        form.setValue('photo_url', base64Image);
        toast.success('Photo cropped and added to profile.');
    };

    // Step Validation Logic
    const nextStep = async () => {
        let fieldsToValidate: (keyof StudentFormData)[] = [];

        if (step === 1) {
            fieldsToValidate = ['roll_number', 'full_name', 'date_of_birth'];
        } else if (step === 2) {
            fieldsToValidate = ['class_id', 'parent_id', 'monthly_fee'];
        }

        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
            setStep((prev) => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setStep((prev) => Math.max(prev - 1, 1));
    };

    async function onSubmit(values: StudentFormData) {
        if (step !== 3) {
            nextStep();
            return;
        }

        createStudentMutation.mutate(values, {
            onSuccess: () => {
                toast.success('Student registered successfully.');
                setOpen(false);
                setStep(1); // Reset step on successful close
                form.reset();
            },
            onError: (error: unknown) => {
                toast.error((error as Error).message || 'Failed to register student.');
            },
        });
    }

    // Reset state when dialong closes manually
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setIsCreatingParent(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Student
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary">
                <DialogHeader>
                    <DialogTitle>Register Student</DialogTitle>
                    <DialogDescription>
                        Step {step} of 3: {step === 1 ? 'Personal Information' : step === 2 ? 'Academic & Guardian' : 'Document Vault'}
                    </DialogDescription>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                        <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-4">

                        {/* STEP 1: Personal Info */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                            </div>
                        )}

                        {/* STEP 2: Academic & Parent */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <FormField
                                    control={form.control}
                                    name="class_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Assign Class <span className="text-destructive">*</span></FormLabel>
                                                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary px-2" asChild>
                                                    <Link href="/settings/classes">
                                                        <Plus className="h-3 w-3 mr-1" /> New Class
                                                    </Link>
                                                </Button>
                                            </div>
                                            <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isClassesLoading}>
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
                                    name="parent_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Assign Parent <span className="text-destructive">*</span></FormLabel>
                                                {!isCreatingParent && (
                                                    <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary px-2" onClick={(e) => { e.preventDefault(); setIsCreatingParent(true); }}>
                                                        <Plus className="h-3 w-3 mr-1" /> New Parent
                                                    </Button>
                                                )}
                                            </div>
                                            <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isParentsLoading || isCreatingParent}>
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
                                    name="monthly_fee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monthly Fee <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g. 5000" 
                                                    value={field.value !== null && field.value !== undefined ? field.value : ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-[10px] text-muted-foreground font-medium italic">
                                                * Fixed monthly fee for this student.
                                            </p>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* STEP 3: Document Vault */}
                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="border rounded-md p-4 bg-muted/40 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <UploadCloud className="w-4 h-4 text-primary" />
                                        Student Photo (Optional)
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Upload a clear portrait photo for the student profile and ID card.
                                    </p>
                                    <div className="flex items-center gap-4">
                                        {form.watch('photo_url') && (
                                            <div className="shrink-0">
                                                <img src={form.watch('photo_url') as string} alt="Student Preview" className="w-16 h-16 object-cover rounded-full border shadow-sm bg-background" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, 'photo_url')}
                                                disabled={isUploading}
                                                className="text-xs bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded-md p-4 bg-muted/40 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <UploadCloud className="w-4 h-4 text-primary" />
                                        Document Vault (B-Form or ID)
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Upload official identification documents. This step is optional and can be done later securely from the student profile.
                                    </p>
                                    <Input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => handleFileUpload(e, 'b_form_url')}
                                        disabled={isUploading}
                                        className="text-xs bg-background"
                                    />
                                    {form.watch('b_form_url') && (
                                        <p className="text-xs text-green-600 font-medium tracking-tight flex items-center mt-2">
                                            <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-2">✓</span>
                                            Document securely stored in vault.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Wizard Navigation Footer */}
                        <div className="pt-6 flex items-center justify-between border-t mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={step === 1 ? () => setOpen(false) : prevStep}
                            >
                                {step === 1 ? 'Cancel' : (
                                    <>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                    </>
                                )}
                            </Button>

                            {step < 3 ? (
                                <Button type="button" onClick={nextStep}>
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={createStudentMutation.isPending || isUploading}
                                    className="bg-primary"
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
                            )}
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
