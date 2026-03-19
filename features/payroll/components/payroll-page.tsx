'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, Edit2, Loader2, Search, Receipt, Trash2 } from 'lucide-react';

import { useGetPayroll, useUpdateSalary } from '../api/use-payroll';
import { useGetLedger, useDeletePayout } from '../api/use-payroll-ledger';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthPicker } from '@/components/ui/month-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { ProcessPayoutDialog } from './process-payout-dialog';

type StaffRow = {
    user_id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    profile_id: string | undefined;
    qualification: string;
    monthly_salary: number;
};

export function PayrollPage() {
    const { data: staff, isLoading } = useGetPayroll();
    const { data: ledger, isLoading: isLoadingLedger } = useGetLedger();
    const updateSalaryMutation = useUpdateSalary();
    const deletePayoutMutation = useDeletePayout();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<StaffRow | null>(null);

    // For the edit salary dialog
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [selectedName, setSelectedName] = useState('');
    const [salaryInput, setSalaryInput] = useState<string>('');

    const handleEdit = (teacher: StaffRow) => {
        if (!teacher.profile_id) {
            toast.error("Profile not found. Please ensure this staff member has a teacher profile.");
            return;
        }
        setSelectedProfileId(teacher.profile_id);
        setSelectedName(teacher.full_name);
        setSalaryInput(teacher.monthly_salary.toString());
        setIsDialogOpen(true);
    };

    const handlePayout = (teacher: StaffRow) => {
        if (!teacher.profile_id) {
            toast.error("Profile not found. Please ensure this staff member has a teacher profile.");
            return;
        }
        setSelectedTeacher(teacher);
        setIsPayoutOpen(true);
    };

    const handleSave = () => {
        const salary = Number(salaryInput);
        if (isNaN(salary) || salary < 0) {
            toast.error("Please enter a valid positive number");
            return;
        }

        updateSalaryMutation.mutate(
            { profileId: selectedProfileId, salary },
            {
                onSuccess: () => {
                    toast.success('Salary updated successfully');
                    setIsDialogOpen(false);
                },
                onError: (err) => toast.error(err.message),
            }
        );
    };

    const handleDeletePayout = (id: string) => {
        deletePayoutMutation.mutate(id, {
            onSuccess: () => {
                toast.success('Payout record deleted successfully.');
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to delete payout record.');
            }
        });
    };

    const filteredStaff = staff?.filter((t: StaffRow) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return t.full_name.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
    });

    const totalMonthlyPayroll = staff?.reduce((sum: number, t: StaffRow) => sum + (Number(t.monthly_salary) || 0), 0) ?? 0;
    const totalPaidThisMonth = (() => {
        return ledger?.filter((e) => e.month_year === selectedMonth)
            .reduce((sum, e) => sum + Number(e.net_paid), 0) ?? 0;
    })();

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Staff Payroll</h1>
                            <p className="text-sm text-muted-foreground">Manage teacher salaries and record monthly payouts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border">
                        <span className="text-sm font-medium text-muted-foreground px-2 whitespace-nowrap hidden sm:inline-block">Viewing</span>
                        <MonthPicker 
                            value={selectedMonth} 
                            onChange={setSelectedMonth} 
                        />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-primary">Total Monthly Payroll</p>
                            <h3 className="text-3xl font-bold text-foreground mt-2">
                                Rs. {isLoading ? '-' : totalMonthlyPayroll.toLocaleString()}
                            </h3>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">Paid in {selectedMonth}</p>
                            <h3 className="text-3xl font-bold text-foreground mt-2">
                                Rs. {isLoadingLedger ? '-' : totalPaidThisMonth.toLocaleString()}
                            </h3>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs: Staff Directory / Ledger History */}
                <Tabs defaultValue="directory">
                    <TabsList>
                        <TabsTrigger value="directory">Staff Directory</TabsTrigger>
                        <TabsTrigger value="ledger">
                            <Receipt className="w-4 h-4 mr-2" />
                            Payout Ledger
                        </TabsTrigger>
                    </TabsList>

                    {/* ── TAB 1: Staff Directory ── */}
                    <TabsContent value="directory">
                        {isLoading ? (
                            <Skeleton className="h-[400px] w-full rounded-xl" />
                        ) : (
                            <Card>
                                <CardHeader className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <CardTitle className="text-lg">Staff Directory</CardTitle>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search staff..."
                                            className="pl-9 h-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Staff Name</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Contact</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Qualification</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Status</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Monthly Salary</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredStaff?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-muted-foreground">No staff found.</td>
                                                </tr>
                                            ) : null}
                                            {(filteredStaff ?? []).map((teacher: StaffRow, idx: number) => (
                                                <motion.tr
                                                    key={teacher.user_id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="hover:bg-muted/20 transition-colors"
                                                >
                                                    <td className="px-5 py-4 font-semibold">{teacher.full_name}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="text-xs text-muted-foreground">{teacher.email}</div>
                                                        <div className="text-xs">{teacher.phone_number}</div>
                                                    </td>
                                                    <td className="px-5 py-4 text-muted-foreground">{teacher.qualification}</td>
                                                    <td className="px-5 py-4">
                                                        {ledger?.some(l => l.teacher_id === teacher.user_id && l.month_year === selectedMonth) ? (
                                                            <Badge className="bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-inset ring-emerald-500/20">PAID</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground bg-muted/30">UNPAID</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-foreground">
                                                        Rs. {Number(teacher.monthly_salary).toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Button>
                                                            <Button size="sm" onClick={() => handlePayout(teacher)}>
                                                                <Wallet className="h-4 w-4 mr-2" />
                                                                Pay
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
                    </TabsContent>

                    {/* ── TAB 2: Payout Ledger ── */}
                    <TabsContent value="ledger">
                        {isLoadingLedger ? (
                            <Skeleton className="h-[400px] w-full rounded-xl" />
                        ) : (
                            <Card>
                                <CardHeader className="border-b pb-4">
                                    <CardTitle className="text-lg">Payout History</CardTitle>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Staff Name</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Month</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Base Salary</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Deductions</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Net Paid</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground">Status</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {(!ledger || ledger.filter(e => e.month_year === selectedMonth).length === 0) ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                                        No payout records found for {selectedMonth}.
                                                    </td>
                                                </tr>
                                            ) : ledger.filter(e => e.month_year === selectedMonth).map((entry, idx) => (
                                                <motion.tr
                                                    key={entry.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="hover:bg-muted/20 transition-colors"
                                                >
                                                    <td className="px-5 py-4 font-semibold">{entry.full_name}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{entry.month_year}</td>
                                                    <td className="px-5 py-4">Rs. {Number(entry.base_salary).toLocaleString()}</td>
                                                    <td className="px-5 py-4 text-red-500">
                                                        {Number(entry.deductions) > 0 ? `- Rs. ${Number(entry.deductions).toLocaleString()}` : '—'}
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-green-600">
                                                        Rs. {Number(entry.net_paid).toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                            {entry.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deletePayoutMutation.isPending}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Payout Record?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete this payout record for <strong>{entry.full_name}</strong> ({entry.month_year})? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction 
                                                                        onClick={() => handleDeletePayout(entry.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Delete Record
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Edit Salary Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Salary</DialogTitle>
                        <DialogDescription>
                            Set the monthly fixed salary for <strong>{selectedName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Monthly Salary Amount (Rs.)</label>
                            <Input
                                type="number"
                                min={0}
                                value={salaryInput}
                                onChange={(e) => setSalaryInput(e.target.value)}
                                placeholder="e.g. 50000"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateSalaryMutation.isPending}>
                            {updateSalaryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Salary
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Process Payout Dialog */}
            <ProcessPayoutDialog
                isOpen={isPayoutOpen}
                setIsOpen={setIsPayoutOpen}
                teacher={selectedTeacher}
                ledger={ledger}
                selectedMonth={selectedMonth}
            />
        </PageTransition>
    );
}
