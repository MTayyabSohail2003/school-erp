'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Search, Phone, CheckCircle } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

import { useGetChallans, useUpdateChallanStatus } from '../api/use-challans';
import { type ChallanStatus } from '../schemas/fee-challan.schema';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';

export function DefaultersPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all challans; we will filter for defaulters locally
    const { data: allChallans, isLoading } = useGetChallans();
    const updateStatusMutation = useUpdateChallanStatus();

    const handleMarkPaid = (id: string) => {
        updateStatusMutation.mutate({ id, status: 'PAID' });
    };

    const today = new Date();

    const defaulters = allChallans?.filter((c) => {
        if (c.status === 'PAID') return false;

        const isOverdueEnum = c.status === 'OVERDUE';
        const isPastDueDate = c.status === 'PENDING' && isAfter(today, parseISO(c.due_date));

        if (!isOverdueEnum && !isPastDueDate) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                c.students?.full_name.toLowerCase().includes(q) ||
                c.students?.roll_number.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const totalOverdueAmount = defaulters?.reduce((sum, c) => sum + c.amount_due, 0) ?? 0;

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">Defaulters List</h1>
                            <p className="text-sm text-muted-foreground">Students with unpaid or overdue fee challans</p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Defaulters</p>
                            <h3 className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">
                                {isLoading ? '-' : defaulters?.length ?? 0}
                            </h3>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Total Overdue Amount</p>
                            <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-2">
                                Rs. {isLoading ? '-' : totalOverdueAmount.toLocaleString()}
                            </h3>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex flex-col space-y-1.5 w-full sm:max-w-md">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Student</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search defaulters by name or roll..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                {isLoading ? (
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                ) : (
                    <Card>
                        <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Action Required</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Student</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Class</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Month</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Amount Due</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Due Date</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {defaulters?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                                                <p className="font-medium text-foreground">Zero Defaulters</p>
                                                <p className="text-sm">All students are up to date with their payments!</p>
                                            </td>
                                        </tr>
                                    ) : null}
                                    {(defaulters ?? []).map((challan, idx) => (
                                        <motion.tr
                                            key={challan.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                                            className="hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-red-500 w-8">{challan.students?.roll_number}</span>
                                                    <span className="font-semibold">{challan.students?.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">
                                                {challan.students?.classes.name} - {challan.students?.classes.section}
                                            </td>
                                            <td className="px-5 py-4 font-medium">
                                                {format(parseISO(`${challan.month_year}-01`), 'MMM yyyy')}
                                            </td>
                                            <td className="px-5 py-4 font-bold text-foreground">
                                                Rs. {challan.amount_due.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50">
                                                    {format(parseISO(challan.due_date), 'dd MMM yyyy')}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="h-8 shadow-sm">
                                                        <Phone className="h-3.5 w-3.5 mr-2" />
                                                        Remind
                                                    </Button>
                                                    <Button variant="default" size="sm" className="h-8 shadow-sm" onClick={() => handleMarkPaid(challan.id!)}>
                                                        Mark Paid
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </PageTransition>
    );
}
