'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Users, UploadCloud, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { bulkRegisterStudentsAction } from '../api/student-actions';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useGetParents } from '@/features/parents/api/use-get-parents';
import { storageApi } from '@/features/storage/api/storage.api';
import { bulkStudentFormSchema, BulkStudentFormData } from '../schemas/student.schema';

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
    FormMessage,
    FormLabel,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function BulkAddStudentsDialog() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();
    
    const { data: classesData, isLoading: isLoadingClasses } = useClasses();
    const { data: parents, isLoading: isParentsLoading } = useGetParents();

    const defaultStudentObj = {
        roll_number: '',
        full_name: '',
        date_of_birth: '',
        academic_year: (new Date().getFullYear()).toString(),
        b_form_id: '',
        parent_id: '',
        monthly_fee: 0,
        photo_url: null,
        b_form_url: null
    };

    const form = useForm<BulkStudentFormData>({
        resolver: zodResolver(bulkStudentFormSchema),
        defaultValues: {
            class_id: '',
            students: [ { ...defaultStudentObj } ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "students",
    });

    const watchedClassId = form.watch('class_id');
    const prevClassId = useRef<string>('');

    useEffect(() => {
        if (!watchedClassId || watchedClassId === prevClassId.current) return;
        
        const selectedClass = classesData?.find(c => c.id === watchedClassId);
        if (selectedClass) {
            const classNum = selectedClass.name.match(/\d+/)?.[0] || selectedClass.name;
            const prefix = `C${classNum}-${selectedClass.section}-`.toUpperCase().replace(/\s+/g, '');
            
            // Apply prefix to all rows dynamically
            const currentStudents = form.getValues('students');
            currentStudents.forEach((student, index) => {
                const currentRoll = student.roll_number || '';
                const existingSuffix = currentRoll.split('-').pop() || '';
                const isJustPrefix = currentRoll.includes('-') && !/\d+$/.test(currentRoll);
                form.setValue(`students.${index}.roll_number`, prefix + (isJustPrefix ? '' : existingSuffix));
            });
        }
        prevClassId.current = watchedClassId;
    }, [watchedClassId, classesData, form]);

    const getDynamicPrefix = () => {
        const currentClassId = form.getValues('class_id');
        if (!currentClassId) return '';
        const selectedClass = classesData?.find(c => c.id === currentClassId);
        if (selectedClass) {
            const classNum = selectedClass.name.match(/\d+/)?.[0] || selectedClass.name;
            return `C${classNum}-${selectedClass.section}-`.toUpperCase().replace(/\s+/g, '');
        }
        return '';
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, fieldName: 'photo_url' | 'b_form_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const folder = fieldName === 'photo_url' ? 'vault/photos' : 'documents';
            const url = await storageApi.uploadDocument(file, 'documents', folder);
            
            form.setValue(`students.${index}.${fieldName}`, url);
            toast.success(`${fieldName === 'photo_url' ? 'Photo' : 'Document'} securely uploaded to vault.`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload file.');
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (values: BulkStudentFormData) => {
        setIsSubmitting(true);
        try {
            const res = await bulkRegisterStudentsAction(values);
            if (!res.success) throw new Error(res.error);

            toast.success(res.message || "Bulk registration successful", {
                description: `Successfully added ${values.students.length} students.`,
            });
            
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setOpen(false);
            form.reset({ class_id: '', students: [ { ...defaultStudentObj } ] });
        } catch (error: any) {
            toast.error((error as Error).message || 'Failed to bulk add students');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        // Intentionally not resetting the form here to prevent accidental data loss.
    };

    const handleReset = () => {
        form.reset({
            class_id: '',
            students: [ { ...defaultStudentObj } ]
        });
        toast.info("Bulk form has been cleared.");
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2 shrink-0">
                    <Users className="h-4 w-4" />
                    Bulk Add
                </Button>
            </DialogTrigger>
            {/* The !max-w-none !w-[100vw] !h-[100vh] completely destroys Radix constraints */}
            <DialogContent 
                className="!max-w-none !w-[100vw] !h-[100vh] !m-0 !rounded-none overflow-hidden flex flex-col p-4 sm:p-6 bg-background"
                onInteractOutside={(e) => {
                    // Also prevent closing exclusively when clicking outside, so they have to use Cancel or X
                    e.preventDefault();
                }}
            >
                <DialogHeader className="shrink-0 mb-4">
                    <DialogTitle className="text-2xl sm:text-3xl">Comprehensive Bulk Student Registration</DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        Register massive batches of students directly into the vault. Include photos, b-forms, parents, and exact fees without leaving this screen.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden space-y-4">
                        <div className="shrink-0 max-w-sm">
                            <FormField
                                control={form.control as any}
                                name="class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Target Class for Batch <span className="text-destructive">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger disabled={isLoadingClasses} className="bg-muted/50 border border-primary/20 h-12 text-base shadow-sm">
                                                    <SelectValue placeholder="Select target class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classesData?.map(c => (
                                                    <SelectItem key={c.id} value={c.id || ''} className="text-base">
                                                        {c.name} - Section {c.section}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <ScrollArea className="flex-1 w-full border border-primary/10 rounded-xl bg-background/50 shadow-inner overflow-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/50 hover:[&::-webkit-scrollbar-thumb]:bg-primary transition-colors">
                            <div className="p-4 min-w-[2000px] flex flex-col gap-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr_1fr_1.5fr_1fr_1fr_auto] gap-4 items-start bg-card p-4 rounded-xl border border-border shadow-sm hover:border-primary/40 transition-colors">
                                        <FormField
                                            control={form.control as any}
                                            name={`students.${index}.roll_number`}
                                            render={({ field: f }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">Roll No. <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl><Input placeholder="2026-001" {...f} className="h-10 border-primary/10" /></FormControl>
                                                    <FormMessage className="text-xs mt-1" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name={`students.${index}.full_name`}
                                            render={({ field: f }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">Full Name <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl><Input placeholder="Student Name" {...f} className="h-10 border-primary/10" /></FormControl>
                                                    <FormMessage className="text-xs mt-1" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name={`students.${index}.date_of_birth`}
                                            render={({ field: f }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">DOB <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl><Input type="date" {...f} className="h-10 border-primary/10" /></FormControl>
                                                    <FormMessage className="text-xs mt-1" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name={`students.${index}.b_form_id`}
                                            render={({ field: f }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">B-Form ID (Opt)</FormLabel>
                                                    <FormControl><Input placeholder="35201-XXXXXXX-X" {...f} className="h-10 border-primary/10" /></FormControl>
                                                    <FormMessage className="text-xs mt-1" />
                                                </FormItem>
                                            )}
                                        />
                                        
                                        {/* Image Upload Column */}
                                        <div className="space-y-2">
                                            <FormLabel className="text-sm font-semibold flex items-center gap-1"><ImageIcon className="w-4 h-4 text-primary" /> Image (Opt)</FormLabel>
                                            <div className="flex h-10 border border-primary/10 rounded-md bg-transparent px-3 py-2 text-sm">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="w-full text-xs file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-2 file:py-1 file:text-xs file:cursor-pointer hover:file:bg-primary/90"
                                                    onChange={(e) => handleFileUpload(e, index, 'photo_url')}
                                                    disabled={isUploading}
                                                />
                                            </div>
                                            {form.watch(`students.${index}.photo_url`) && (
                                                <p className="text-[10px] text-green-600 font-medium">✓ Uploaded</p>
                                            )}
                                        </div>

                                        {/* Document Upload Column */}
                                        <div className="space-y-2">
                                            <FormLabel className="text-sm font-semibold flex items-center gap-1"><UploadCloud className="w-4 h-4 text-primary" /> B-Form (Opt)</FormLabel>
                                            <div className="flex h-10 border border-primary/10 rounded-md bg-transparent px-3 py-2 text-sm">
                                                <input 
                                                    type="file" 
                                                    accept=".pdf,image/*" 
                                                    className="w-full text-xs file:bg-secondary file:text-secondary-foreground file:border-0 file:rounded file:px-2 file:py-1 file:text-xs file:cursor-pointer hover:file:bg-secondary/90"
                                                    onChange={(e) => handleFileUpload(e, index, 'b_form_url')}
                                                    disabled={isUploading}
                                                />
                                            </div>
                                            {form.watch(`students.${index}.b_form_url`) && (
                                                <p className="text-[10px] text-green-600 font-medium">✓ Vault Secured</p>
                                            )}
                                        </div>

                                        <FormField
                                            control={form.control as any}
                                            name={`students.${index}.parent_id`}
                                            render={({ field: f }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">Assign Parent <span className="text-destructive">*</span></FormLabel>
                                                    <Select onValueChange={f.onChange} value={f.value || undefined} disabled={isParentsLoading}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 border-primary/10">
                                                                <SelectValue placeholder="Select Parent" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {parents?.map((p) => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.full_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-xs mt-1" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name={`students.${index}.academic_year`}
                                            render={({ field: f }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">Academic Yr <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl><Input placeholder="2025" {...f} className="h-10 border-primary/10" /></FormControl>
                                                    <FormMessage className="text-xs mt-1" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name={`students.${index}.monthly_fee`}
                                            render={({ field: f }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">Monthly Fee <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="number" 
                                                            {...f} 
                                                            value={f.value !== null && f.value !== undefined ? f.value : ''}
                                                            className="h-10 border-primary/10" 
                                                            onChange={e => f.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs mt-1" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="pt-8">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0 shadow-sm border border-destructive/20"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="h-3 bg-muted border-t" />
                        </ScrollArea>

                        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-primary/10 mt-6 shrink-0 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ ...defaultStudentObj, roll_number: getDynamicPrefix() })}
                                className="gap-2 text-primary border-primary hover:bg-primary hover:text-white transition-all w-full sm:w-auto h-12 px-6 text-base font-semibold shadow-md"
                            >
                                <Plus className="h-5 w-5" />
                                Add Another Student Row
                            </Button>

                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button type="button" variant="ghost" onClick={handleReset} className="h-12 px-6 text-base text-muted-foreground hover:text-destructive flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4" /> Reset Form
                                </Button>
                                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 sm:flex-none h-12 px-6 text-base">
                                    Close Window
                                </Button>
                                <Button type="submit" disabled={isSubmitting || isUploading || fields.length === 0} className="min-w-[200px] flex-1 sm:flex-none bg-primary hover:bg-primary/90 h-12 text-base font-bold shadow-lg">
                                    {isSubmitting || isUploading ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : null}
                                    Register Batch ({fields.length})
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
