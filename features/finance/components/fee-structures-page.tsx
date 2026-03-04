'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Banknote, Edit2, Loader2 } from 'lucide-react';

import { useClasses } from '@/features/classes/hooks/use-classes';
import { useGetFeeStructures, useUpsertFeeStructure } from '../api/use-fee-structures';
import { feeStructureSchema, type FeeStructureFormValues } from '../schemas/fee-structure.schema';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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

export function FeeStructuresPage() {
    const { data: classes, isLoading: classesLoading } = useClasses();
    const { data: structures, isLoading: structuresLoading } = useGetFeeStructures();
    const upsertMutation = useUpsertFeeStructure();

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<FeeStructureFormValues>({
        resolver: zodResolver(feeStructureSchema),
        defaultValues: {
            class_id: '',
            monthly_fee: 0,
        },
    });

    const isLoading = classesLoading || structuresLoading;

    // Helper to find fee for a class
    const getFeeForClass = (classId: string) => {
        return structures?.find((s) => s.class_id === classId);
    };

    const handleEdit = (cls: { id: string, name: string, section: string }) => {
        const existing = getFeeForClass(cls.id);
        form.reset({
            id: existing?.id,
            class_id: cls.id,
            monthly_fee: existing?.monthly_fee ?? 0,
        });
        setIsDialogOpen(true);
    };

    const onSubmit = (values: FeeStructureFormValues) => {
        upsertMutation.mutate(values, {
            onSuccess: () => {
                toast.success('Fee structure updated successfully');
                setIsDialogOpen(false);
            },
            onError: (err) => toast.error(err.message),
        });
    };

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Fee Structures</h1>
                            <p className="text-sm text-muted-foreground">Manage monthly tuition fees per class</p>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                ) : (
                    <Card>
                        <CardHeader className="border-b pb-4">
                            <CardTitle className="text-lg">Class Configurations</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Class</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Section</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Monthly Fee (Rs.)</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground w-32 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {classes?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No classes found. Add classes first.
                                            </td>
                                        </tr>
                                    ) : null}
                                    {(classes ?? []).map((cls, idx) => {
                                        const feeRecord = getFeeForClass(cls.id);
                                        const hasFee = !!feeRecord;

                                        return (
                                            <motion.tr
                                                key={cls.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="hover:bg-muted/20 transition-colors"
                                            >
                                                <td className="px-5 py-4 font-semibold">{cls.name}</td>
                                                <td className="px-5 py-4 text-muted-foreground">{cls.section}</td>
                                                <td className="px-5 py-4 font-medium">
                                                    {hasFee ? (
                                                        <span className="text-foreground">Rs. {feeRecord.monthly_fee.toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md text-xs font-semibold">
                                                            Not Configured
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cls)}>
                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                        {hasFee ? 'Edit' : 'Set Fee'}
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Set Fee Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Fee Structure</DialogTitle>
                        <DialogDescription>
                            Set the standard monthly tuition fee for this class.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="monthly_fee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Fee Amount (Rs.)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="e.g. 5000"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={upsertMutation.isPending}>
                                    {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Fee Structure
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </PageTransition>
    );
}
