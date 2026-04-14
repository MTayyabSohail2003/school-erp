'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, Edit2, Loader2, Search, Receipt, Trash2, Landmark, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react';

import { useUpdateSalary } from '../api/use-payroll';
import { useGetPayrollDashboard, useDeletePayout, useGetHistoricalLedger } from '../api/use-payroll-ledger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Check, User, CheckCircle, Clock } from 'lucide-react';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';

import { PayrollStatsCards } from './payroll-stats-cards';
import { PayStaffModal } from './pay-staff-modal';

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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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

// Removed old ProcessPayoutDialog in favor of PayStaffModal

type StaffRow = {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    profile_id: string;
    base_salary: number;
    attendancePercentage: number;
    historicalArrears: number;
    bonus: number;
    bonus_notes: string;
    fine: number;
    fine_notes: string;
    paid_notes: string;
    arrears_note: string;
    net_paid: number;
    method: string;
    ledger: any;
    status: string;
    attendanceStats?: {
        presents: number;
        absents: number;
        leaves: number;
        totalMarked: number;
    };
};

export function PayrollPage() {
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const { data: dashboardRecords, isLoading } = useGetPayrollDashboard(selectedMonth);
    
    const updateSalaryMutation = useUpdateSalary();
    const deletePayoutMutation = useDeletePayout();

    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<StaffRow | null>(null);

    // For the edit salary dialog
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [selectedName, setSelectedName] = useState('');
    const [salaryInput, setSalaryInput] = useState<string>('');

    const handleEdit = (teacher: StaffRow) => {
        setSelectedProfileId(teacher.profile_id);
        setSelectedName(teacher.full_name);
        setSalaryInput(teacher.base_salary.toString());
        setIsDialogOpen(true);
    };

    const handlePayout = (teacher: StaffRow) => {
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

    const filteredStaff = dashboardRecords?.filter((t: StaffRow) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return t.full_name.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
    });


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
                <PayrollStatsCards data={dashboardRecords} isLoading={isLoading} />

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
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Staff Name & Notices</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Attendance %</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Base Salary</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Bonus</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Fine</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Net Paid</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Debt (Arrears)</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Status</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Method</th>
                                                <th className="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-widest text-[10px] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredStaff?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={10} className="text-center py-8 text-muted-foreground">No staff found.</td>
                                                </tr>
                                            ) : null}
                                            {(filteredStaff ?? []).map((teacher: StaffRow, idx: number) => (
                                                <motion.tr
                                                    key={teacher.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="hover:bg-muted/20 transition-colors group"
                                                >
                                                    <td className="px-5 py-4 min-w-[200px]">
                                                        <div className="flex items-center gap-3">
                                                            <ImagePreviewDialog 
                                                                src={teacher.avatar_url} 
                                                                title={teacher.full_name} 
                                                                description="Staff Directory Profile"
                                                            >
                                                                <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform group-hover:scale-110 duration-500 shadow-sm">
                                                                    <AvatarImage src={teacher.avatar_url} className="object-cover" />
                                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">
                                                                        {teacher.full_name.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </ImagePreviewDialog>
                                                            <div>
                                                                <p className="font-bold text-foreground text-sm leading-tight tracking-tight">{teacher.full_name}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{teacher.email}</p>
                                                            </div>
                                                        </div>
                                                            
                                                            {/* Smart Notices - Hover Driven */}
                                                            <TooltipProvider>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {teacher.bonus > 0 && teacher.bonus_notes && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center cursor-help hover:bg-emerald-500/20 transition-colors">
                                                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-emerald-600 text-white font-bold rounded-xl border-none shadow-xl drop-shadow-2xl">
                                                                            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Monthly Bonus Reason</p>
                                                                            <p className="text-sm">{teacher.bonus_notes}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}

                                                                {teacher.fine > 0 && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="h-6 w-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center cursor-help hover:bg-red-500/20 transition-colors">
                                                                                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-red-600 text-white font-bold rounded-xl border-none shadow-xl drop-shadow-2xl">
                                                                            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Salary Deduction Reason</p>
                                                                            <p className="text-sm">{teacher.fine_notes || 'Monthly fine applied'}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}

                                                                {(teacher.historicalArrears > 0 || (teacher.status === 'PARTIAL' && teacher.paid_notes)) && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="h-6 w-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center cursor-help hover:bg-orange-500/20 transition-colors">
                                                                                <Receipt className="w-3.5 h-3.5 text-orange-600" />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-orange-600 text-white font-bold rounded-xl border-none shadow-xl drop-shadow-2xl">
                                                                            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Outstanding Balance Reason</p>
                                                                            <p className="text-sm">{teacher.paid_notes || teacher.arrears_note || 'Debt carried forward from previous months'}</p>
                                                                            <p className="text-[9px] mt-2 opacity-50 italic">Balance will persist until full settlement</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}

                                                                {teacher.status === 'PAID' && teacher.paid_notes && !teacher.historicalArrears && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="h-6 w-6 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center cursor-help hover:bg-zinc-500/20 transition-colors">
                                                                                <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-zinc-800 text-white font-bold rounded-xl border-none shadow-xl">
                                                                            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Payout Remarks</p>
                                                                            <p className="text-sm">{teacher.paid_notes}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                            </TooltipProvider>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-2 cursor-help group">
                                                                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                                                                            <div 
                                                                                className={`h-full rounded-full transition-all duration-500 ${teacher.attendancePercentage >= 90 ? 'bg-emerald-500' : teacher.attendancePercentage >= 75 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                                                style={{ width: `${teacher.attendancePercentage}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-black group-hover:text-primary transition-colors">{Math.round(teacher.attendancePercentage)}%</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="p-3 bg-zinc-900 border-zinc-800 text-white rounded-xl shadow-2xl">
                                                                    <div className="space-y-2">
                                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-1.5">Monthly Attendance Breakdown</p>
                                                                        <div className="grid grid-cols-3 gap-3">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-emerald-500 font-black text-sm">{teacher.attendanceStats?.presents || 0}</span>
                                                                                <span className="text-[9px] uppercase font-bold text-white/30">Present</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-orange-500 font-black text-sm">{teacher.attendanceStats?.leaves || 0}</span>
                                                                                <span className="text-[9px] uppercase font-bold text-white/30">Leaves</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-red-500 font-black text-sm">{teacher.attendanceStats?.absents || 0}</span>
                                                                                <span className="text-[9px] uppercase font-bold text-white/30">Absent</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[9px] text-white/20 pt-1.5 italic border-t border-white/5">Calculated from {teacher.attendanceStats?.totalMarked || 0} marked days</p>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-foreground">
                                                        Rs. {Number(teacher.base_salary).toLocaleString()}
                                                    </td>
                                                    <td className={`px-5 py-4 font-black ${teacher.bonus > 0 ? 'text-emerald-600 italic' : 'text-muted-foreground/40'}`}>
                                                        {teacher.bonus > 0 ? `+Rs. ${teacher.bonus.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className={`px-5 py-4 font-black ${teacher.fine > 0 ? 'text-red-600 italic' : 'text-muted-foreground/40'}`}>
                                                        {teacher.fine > 0 ? `-Rs. ${teacher.fine.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {teacher.net_paid > 0 ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex flex-col cursor-help group">
                                                                            <span className="text-sm font-black text-emerald-600">Rs. {teacher.net_paid.toLocaleString()}</span>
                                                                            <span className="text-[9px] font-black text-muted-foreground/40 group-hover:text-emerald-500 transition-colors uppercase tracking-tighter flex items-center gap-1">
                                                                                <Receipt className="w-2.5 h-2.5" /> View Breakdown
                                                                            </span>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="right" className="p-4 bg-zinc-900 border-zinc-800 text-white rounded-2xl shadow-2xl min-w-[200px]">
                                                                        <div className="space-y-3">
                                                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-white/10 pb-2">Salary Payout Breakdown</p>
                                                                            <div className="space-y-1.5">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-white/50">Base Salary</span>
                                                                                    <span className="font-bold">Rs. {Number(teacher.base_salary).toLocaleString()}</span>
                                                                                </div>
                                                                                {teacher.bonus > 0 && (
                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-emerald-500/70">Monthly Bonus</span>
                                                                                        <span className="font-bold text-emerald-500">+Rs. {teacher.bonus.toLocaleString()}</span>
                                                                                    </div>
                                                                                )}
                                                                                {teacher.fine > 0 && (
                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-red-500/70">Salary Fine</span>
                                                                                        <span className="font-bold text-red-500">-Rs. {teacher.fine.toLocaleString()}</span>
                                                                                    </div>
                                                                                )}
                                                                                {teacher.historicalArrears > 0 && (
                                                                                    <div className="flex justify-between text-xs">
                                                                                        <span className="text-orange-500/70">Previous Arrears</span>
                                                                                        <span className="font-bold text-orange-500">+Rs. {teacher.historicalArrears.toLocaleString()}</span>
                                                                                    </div>
                                                                                )}
                                                                                <div className="pt-2 border-t border-white/5 flex justify-between text-sm">
                                                                                    <span className="font-black text-white/40 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                                                                        <Landmark className="w-3 h-3" /> Total Payable
                                                                                    </span>
                                                                                    <span className="font-black text-white/80">Rs. {(Number(teacher.base_salary) + Number(teacher.historicalArrears) + Number(teacher.bonus) - Number(teacher.fine)).toLocaleString()}</span>
                                                                                </div>
                                                                                <div className="pt-2 flex justify-between text-sm">
                                                                                    <span className="font-black text-emerald-500/50 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                                                                        <Wallet className="w-3 h-3" /> Net Disbursed
                                                                                    </span>
                                                                                    <span className="font-black text-emerald-500 underline decoration-2 underline-offset-4">Rs. {teacher.net_paid.toLocaleString()}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-muted-foreground/20 italic tracking-widest">Not paid</span>
                                                        )}
                                                    </td>
                                                    <td className={`px-5 py-4 font-bold ${teacher.historicalArrears > 0 ? 'text-orange-600 bg-orange-500/5' : 'text-muted-foreground/40'}`}>
                                                        Rs. {teacher.historicalArrears.toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {teacher.status === 'PAID' ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 font-black text-[10px] tracking-widest px-3">PAID</Badge>
                                                        ) : teacher.status === 'PARTIAL' ? (
                                                            <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20 font-black text-[10px] tracking-widest px-3">PARTIAL</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground/60 border-muted-foreground/20 font-black text-[10px] tracking-widest px-3">PENDING</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {teacher.status !== 'PENDING' ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-1.5 w-1.5 rounded-full ${teacher.method === 'BANK' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                                                                    {teacher.method || 'CASH'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-muted-foreground/20 italic tracking-widest">---</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-right transition-all duration-300">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="sm" className="rounded-xl font-bold" onClick={() => handleEdit(teacher)}>
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Button>
                                                            <Button size="sm" className="rounded-xl font-black bg-primary/10 text-primary hover:bg-primary hover:text-white" onClick={() => handlePayout(teacher)}>
                                                                <Wallet className="h-4 w-4 mr-2" />
                                                                {teacher.status === 'PAID' ? 'Review' : 'Pay'}
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
                        <HistoricalLedgerTable />
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

            {/* Pay Staff Modal */}
            <PayStaffModal
                staff={selectedTeacher}
                open={isPayoutOpen}
                onOpenChange={setIsPayoutOpen}
                monthYear={selectedMonth}
            />
        </PageTransition>
    );
}

function HistoricalLedgerTable() {
    const { data: ledgerEntries, isLoading } = useGetHistoricalLedger();

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
        );
    }

    if (!ledgerEntries?.length) {
        return (
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <div className="text-center py-20">
                    <Receipt className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="font-black text-muted-foreground/40 text-xl tracking-tighter">No Payout Records</h3>
                    <p className="text-xs text-muted-foreground/40 max-w-xs mx-auto mt-2">All recorded salary payouts will appear here in chronological order.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black uppercase tracking-widest text-primary/60">Payout Ledger</CardTitle>
                        <p className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Complete financial audit trail</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary" />
                    </div>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-b-border/40">
                            <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 px-6">Staff Member</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Salary Month</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Net Payout</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Method</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest px-6">Marked At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ledgerEntries.map((entry) => (
                            <TableRow key={entry.id} className="hover:bg-muted/30 transition-all group border-b-border/20">
                                <TableCell className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <ImagePreviewDialog 
                                                src={entry.users?.avatar_url} 
                                                title={entry.users?.full_name} 
                                                description={`Salary Payout for ${format(new Date(entry.month_year + '-01'), 'MMMM yyyy')}`}
                                            >
                                                <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform group-hover:scale-105 duration-300">
                                                    <AvatarImage src={entry.users?.avatar_url} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-black">
                                                        {entry.users?.full_name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </ImagePreviewDialog>
                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                                                <Check className="w-2 h-2 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm tracking-tight group-hover:text-primary transition-colors cursor-default">
                                                {entry.users?.full_name}
                                            </span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Authorized Staff</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="bg-muted/50 text-[10px] font-black uppercase rounded-lg border-primary/20 py-1">
                                        {format(new Date(entry.month_year + '-01'), 'MMMM yyyy')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-black text-sm text-emerald-600 italic tracking-tighter">
                                            Rs. {Number(entry.net_paid).toLocaleString()}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">Total Disbursed</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {entry.status === 'PAID' ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                                            <CheckCircle className="w-3 h-3" /> Fully Paid
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                                            <Clock className="w-3 h-3" /> Partial
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-border/40 shadow-sm transition-colors group-hover:border-primary/30">
                                            {entry.method === 'BANK' ? <Landmark className="w-3 h-3 text-primary/60" /> : <Banknote className="w-3 h-3 text-emerald-600/60" />}
                                            <span className="text-[10px] font-black tracking-tighter opacity-80">{entry.method}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-foreground/80">
                                            {format(new Date(entry.paid_at), 'MMM dd, yyyy')}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                                            {format(new Date(entry.paid_at), 'hh:mm a')}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
