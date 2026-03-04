'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, Edit2, Loader2, Search } from 'lucide-react';

import { useGetPayroll, useUpdateSalary } from '../api/use-payroll';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function PayrollPage() {
    const { data: staff, isLoading } = useGetPayroll();
    const updateSalaryMutation = useUpdateSalary();

    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // For the dialog
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [selectedName, setSelectedName] = useState('');
    const [salaryInput, setSalaryInput] = useState<string>('');

    const handleEdit = (teacher: any) => {
        if (!teacher.profile_id) {
            toast.error("Profile not found. Please ensure this staff member has a teacher profile.");
            return;
        }
        setSelectedProfileId(teacher.profile_id);
        setSelectedName(teacher.full_name);
        setSalaryInput(teacher.monthly_salary.toString());
        setIsDialogOpen(true);
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

    const filteredStaff = staff?.filter((t: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return t.full_name.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
    });

    const totalMonthlyPayroll = staff?.reduce((sum: number, t: any) => sum + (Number(t.monthly_salary) || 0), 0) ?? 0;

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
                            <p className="text-sm text-muted-foreground">Manage teacher salaries and overview total monthly payroll</p>
                        </div>
                    </div>
                </div>

                {/* KPI */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-primary">Total Monthly Payroll</p>
                        <h3 className="text-3xl font-bold text-foreground mt-2">
                            Rs. {isLoading ? '-' : totalMonthlyPayroll.toLocaleString()}
                        </h3>
                    </CardContent>
                </Card>

                {/* Filter and Grid */}
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
                                        <th className="px-5 py-3 font-semibold text-muted-foreground">Monthly Salary</th>
                                        <th className="px-5 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredStaff?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No staff found.
                                            </td>
                                        </tr>
                                    ) : null}
                                    {(filteredStaff ?? []).map((teacher: any, idx: number) => (
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
                                            <td className="px-5 py-4 font-bold text-foreground">
                                                Rs. {Number(teacher.monthly_salary).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                                                    <Edit2 className="h-4 w-4 mr-2" />
                                                    Edit Salary
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Set Salary Dialog */}
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
        </PageTransition>
    );
}
