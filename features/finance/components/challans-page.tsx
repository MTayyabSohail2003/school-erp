'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { useGetChallans, useUpdateChallanStatus } from '../api/use-challans';
import { ChallanGenerationCard } from './challan-generation-card';
import { type ChallanStatus } from '../schemas/fee-challan.schema';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ChallansPage() {
    const [monthFilter, setMonthFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<ChallanStatus | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: challans, isLoading } = useGetChallans(
        monthFilter === 'all' ? undefined : monthFilter,
        statusFilter === 'ALL' ? undefined : statusFilter
    );

    const updateStatusMutation = useUpdateChallanStatus();

    const handleStatusChange = (id: string, newStatus: ChallanStatus) => {
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    const filteredChallans = challans?.filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            c.students?.full_name.toLowerCase().includes(q) ||
            c.students?.roll_number.toLowerCase().includes(q)
        );
    });

    // Generate month options dynamically
    const today = new Date();
    const monthOptions = [{ value: 'all', label: 'All Months' }];
    for (let i = -6; i <= 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        monthOptions.push({
            value: format(d, 'yyyy-MM'),
            label: format(d, 'MMMM yyyy'),
        });
    }

    const getStatusBadge = (status: ChallanStatus) => {
        switch (status) {
            case 'PAID':
                return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle className="h-3 w-3" /> Paid</Badge>;
            case 'OVERDUE':
                return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>;
            default:
                return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
        }
    };

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Fee Challans</h1>
                            <p className="text-sm text-muted-foreground">Manage and track student fee payments</p>
                        </div>
                    </div>
                </div>

                <ChallanGenerationCard />

                {/* Filters */}
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-1.5 min-w-[200px]">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Student</label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or roll..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-48 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Month</label>
                                <Select value={monthFilter} onValueChange={setMonthFilter}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-48 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ChallanStatus | 'ALL')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Statuses</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="PAID">Paid</SelectItem>
                                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                {isLoading ? (
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                ) : (
                    <Card>
                        <CardHeader className="border-b pb-4">
                            <CardTitle className="text-lg">Generated Challans ({filteredChallans?.length ?? 0})</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Student</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Class</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Month</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Amount Due</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground text-orange-600 dark:text-orange-400">Arrears</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Status</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredChallans?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                                No challans found matching your filters.
                                            </td>
                                        </tr>
                                    ) : null}
                                    {(filteredChallans ?? []).map((challan, idx) => (
                                        <motion.tr
                                            key={challan.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                                            className="hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-primary w-8">{challan.students?.roll_number}</span>
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
                                                {(challan.arrears ?? 0) > 0 ? (
                                                    <span className="text-orange-600 dark:text-orange-400 font-semibold text-xs">
                                                        +Rs. {challan.arrears!.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {getStatusBadge(challan.status)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Select
                                                    value={challan.status}
                                                    onValueChange={(v) => handleStatusChange(challan.id!, v as ChallanStatus)}
                                                >
                                                    <SelectTrigger className="w-32 h-8 ml-auto">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PENDING">Mark Pending</SelectItem>
                                                        <SelectItem value="PAID">Mark Paid</SelectItem>
                                                        <SelectItem value="OVERDUE">Mark Overdue</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
