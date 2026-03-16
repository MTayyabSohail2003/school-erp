'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Clock } from 'lucide-react';

import { type Period } from '../api/periods.api';
import { useGetPeriods } from '../hooks/use-get-periods';
import { useCreatePeriod } from '../hooks/use-create-period';
import { useDeletePeriod } from '../hooks/use-delete-period';
import { useBulkCreatePeriods } from '../hooks/use-bulk-create-periods';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const periodSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    order_index: z.coerce.number().int().min(0),
});

const bulkGeneratorSchema = z.object({
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    count: z.coerce.number().int().min(1).max(12),
    duration_mins: z.coerce.number().int().min(10).max(120),
    break_after_index: z.coerce.number().int().min(0).max(11),
    break_duration_mins: z.coerce.number().int().min(5).max(60),
});

export function PeriodsSetup() {
    const { data: periods, isLoading } = useGetPeriods();
    const createMutation = useCreatePeriod();
    const bulkMutation = useBulkCreatePeriods();
    const deleteMutation = useDeletePeriod();

    const [open, setOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);

    const form = useForm<z.infer<typeof periodSchema>>({
        resolver: zodResolver(periodSchema),
        defaultValues: { 
            name: '', 
            start_time: '08:00', 
            end_time: '09:00',
            order_index: 0
        },
    });

    const bulkForm = useForm<z.infer<typeof bulkGeneratorSchema>>({
        resolver: zodResolver(bulkGeneratorSchema),
        defaultValues: {
            start_time: '08:15',
            count: 8,
            duration_mins: 40,
            break_after_index: 4,
            break_duration_mins: 20
        }
    });

    const onSubmit = (values: z.infer<typeof periodSchema>) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                toast.success('Period created successfully.');
                form.reset({
                    name: '',
                    start_time: '08:00',
                    end_time: '09:00',
                    order_index: (periods?.length || 0) + 1
                });
                setOpen(false);
            },
            onError: (error: Error) => {
                toast.error(error.message || 'Failed to create period.');
            }
        });
    };

    const onBulkSubmit = (values: z.infer<typeof bulkGeneratorSchema>) => {
        const newPeriods: Omit<Period, 'id'>[] = [];
        let currentTime = values.start_time;
        
        const addMinutes = (time: string, mins: number) => {
            const [h, m] = time.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m + mins, 0);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        };

        let orderCounter = 1;
        for (let i = 1; i <= values.count; i++) {
            const endTime = addMinutes(currentTime, values.duration_mins);
            newPeriods.push({
                name: `Period ${i}`,
                start_time: currentTime,
                end_time: endTime,
                order_index: orderCounter++
            });
            
            currentTime = endTime;
            if (i === values.break_after_index) {
                const breakEnd = addMinutes(currentTime, values.break_duration_mins);
                newPeriods.push({
                    name: 'Break',
                    start_time: currentTime,
                    end_time: breakEnd,
                    order_index: orderCounter++
                });
                currentTime = breakEnd;
            }
        }

        bulkMutation.mutate(newPeriods, {
            onSuccess: () => {
                toast.success(`Generated ${newPeriods.length} periods.`);
                setBulkOpen(false);
            },
            onError: (err: Error) => toast.error(err.message)
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This will remove it from all timetables.`)) return;

        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('Period deleted.'),
            onError: (error: Error) => toast.error(error.message || 'Failed to delete period.'),
        });
    };

    return (
        <Card className="shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Time Periods
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Define the daily schedule slots for your classes.</p>
                    </div>

                    <div className="flex gap-2">
                        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Clock className="h-4 w-4" /> Bulk Generate
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Bulk Generate Periods</DialogTitle>
                                </DialogHeader>
                                <Form {...bulkForm}>
                                    <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4 pt-4">
                                        <FormField
                                            control={bulkForm.control}
                                            name="start_time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>School Start Time</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={bulkForm.control}
                                                name="count"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel># of Periods</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={bulkForm.control}
                                                name="duration_mins"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Duration (mins)</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={bulkForm.control}
                                                name="break_after_index"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Break After Period</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={bulkForm.control}
                                                name="break_duration_mins"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Break Duration</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full mt-4" disabled={bulkMutation.isPending}>
                                            {bulkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Generate slots
                                        </Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" /> Add Single
                                </Button>
                            </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Period</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control as any}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Period Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Period 1, Lunch Break" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control as any}
                                            name="start_time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Time *</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="end_time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Time *</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control as any}
                                        name="order_index"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Order Index (for sorting)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end pt-4">
                                        <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Period
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

                {isLoading ? (
                    <div className="h-32 flex items-center justify-center border rounded-lg bg-muted/10 animate-pulse text-sm text-muted-foreground">Loading periods...</div>
                ) : !periods || periods.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg bg-muted/10 text-muted-foreground text-sm">
                        No periods found. Create your first period to define the schedule.
                    </div>
                ) : (
                    <div className="border rounded-xl overflow-hidden bg-muted/5">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <TableHead className="w-[100px]">Order</TableHead>
                                    <TableHead>Period Name</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.map((period) => (
                                    <TableRow key={period.id} className="group transition-colors hover:bg-muted/10">
                                        <TableCell>
                                            <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                                #{period.order_index}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">{period.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{period.start_time.substring(0, 5)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{period.end_time.substring(0, 5)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                onClick={() => handleDelete(period.id, period.name)}
                                                disabled={deleteMutation.isPending}
                                                className="text-muted-foreground hover:text-destructive transition-colors p-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
