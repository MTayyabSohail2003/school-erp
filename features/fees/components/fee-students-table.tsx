'use client';

import { useState, useEffect } from 'react';
import {
    IndianRupee,
    AlertCircle,
    Clock,
    CheckCircle,
    User,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    Copy,
    TrendingUp,
    Receipt,
    Wallet,
    Printer,
    DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FeePrintReceipt } from './fee-print-receipt';

interface FeeChallanWithStudent {
    id: string;
    student_id?: string;
    amount_due: number;
    paid_amount: number;
    status: string;
    month_year: string;
    arrears?: number;
    fines?: number;
    discount?: number;
    paid_notes?: string | null;
    fine_notes?: string | null;
    arrears_note?: string | null;
    payment_method?: string | null;
    attendance?: {
        percentage: number;
        stats: {
            presents: number;
            absents: number;
            leaves: number;
            totalMarked: number;
        }
    };
    students: {
        full_name: string;
        roll_number: string;
        class_id: string;
        photo_url?: string | null;
        classes: {
            name: string;
            section: string;
        }
    }
}

interface FeeStudentsTableProps {
    data: FeeChallanWithStudent[];
    isLoading: boolean;
    onCollectFee: (challan: FeeChallanWithStudent) => void;
}

export function FeeStudentsTable({ data, isLoading, onCollectFee }: FeeStudentsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [prevDataLength, setPrevDataLength] = useState(data.length);
    const [printingChallan, setPrintingChallan] = useState<FeeChallanWithStudent | null>(null);
    const PAGE_SIZE = 10;

    // Reset pagination and expansion ONLY when data source changes meaningfully
    // Using this pattern during render-phase instead of useEffect to avoid cascading renders
    if (data.length !== prevDataLength) {
        setCurrentPage(1);
        setExpandedId(null);
        setPrevDataLength(data.length);
    }

    if (isLoading) {
        return (
            <div className="grid gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl border border-border" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="glass-card p-12 text-center text-muted-foreground rounded-2xl border-dashed">
                No students found for the selected filters.
            </div>
        );
    }

    const sortedData = [...data].sort((a, b) => {
        const rollA = a.students?.roll_number || '';
        const rollB = b.students?.roll_number || '';
        return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const totalResults = sortedData.length;
    const totalPages = Math.ceil(totalResults / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalResults);
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Roll No. ${text} copied!`);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4">
                {paginatedData.map((challan) => {
                    const totalExpected = Number(challan.amount_due) + Number(challan.arrears || 0) + Number(challan.fines || 0) - Number(challan.discount || 0);
                    const paid = Number(challan.paid_amount || 0);
                    const remaining = totalExpected - paid;
                    const isPaid = remaining <= 0;
                    const isOpen = expandedId === challan.id;

                    return (
                        <Collapsible
                            key={challan.id}
                            open={isOpen}
                            onOpenChange={() => setExpandedId(isOpen ? null : challan.id)}
                            className={cn(
                                "group bg-card transition-all duration-500 border rounded-2xl overflow-hidden",
                                isOpen ? "shadow-2xl border-primary/20 bg-card/80 backdrop-blur-xl accent-bar-active" : "hover:border-primary/20 hover:shadow-md border-border/50",
                                challan.status === 'UNPAID' ? "border-l-4 border-l-amber-500/30" :
                                    challan.status === 'PARTIAL' ? "border-l-4 border-l-amber-500" :
                                        "border-l-4 border-l-emerald-500"
                            )}
                        >
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 cursor-pointer select-none">
                                    <div className="flex items-center gap-4">
                                        <ImagePreviewDialog
                                            src={challan.students?.photo_url}
                                            title={challan.students?.full_name}
                                            description={`Student ID: ${challan.students?.roll_number}`}
                                        >
                                            <Avatar className="h-12 w-12 border-2 border-primary/10 transition-transform group-hover:scale-105 duration-300">
                                                {challan.students?.photo_url ? (
                                                    <AvatarImage src={challan.students.photo_url} className="object-cover" />
                                                ) : null}
                                                <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                                                    {challan.students?.full_name.charAt(0) || <User className="w-5 h-5" />}
                                                </AvatarFallback>
                                            </Avatar>
                                        </ImagePreviewDialog>

                                        <div className="space-y-0.5">
                                            <div className="font-black text-base tracking-tight text-foreground/90 flex items-center gap-2">
                                                {challan.students?.full_name}
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest py-0 px-1.5 h-4 border-muted-foreground/20 text-muted-foreground/60">
                                                    {challan.students?.classes?.name} &bull; {challan.students?.classes?.section}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                    {challan.students?.roll_number}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(challan.students?.roll_number); }}
                                                    className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground/40 hover:text-primary"
                                                >
                                                    <Copy className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Attendance Stats Breakdown */}
                                        <div className="hidden lg:flex flex-col items-center gap-1.5">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Attendance</p>
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-2 cursor-help group/att">
                                                            <div className="h-1.5 w-16 bg-muted/40 rounded-full overflow-hidden border border-border/20">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${challan.attendance?.percentage || 0}%` }}
                                                                    className={cn(
                                                                        "h-full rounded-full",
                                                                        (challan.attendance?.percentage || 0) >= 75 ? "bg-emerald-500" : (challan.attendance?.percentage || 0) >= 50 ? "bg-amber-500" : "bg-red-500"
                                                                    )}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-black tracking-tight text-foreground/70 group-hover/att:text-primary transition-colors italic">
                                                                {(challan.attendance?.percentage || 0).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="p-0 border-none rounded-2xl shadow-2xl">
                                                        <div className="bg-zinc-950 text-white p-3 rounded-2xl overflow-hidden glass-card min-w-[140px]">
                                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 border-b border-white/10 pb-1">Historical Status</p>
                                                            <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-xl mb-1.5 grayscale-[0.5] hover:grayscale-0 transition-all border border-emerald-500/20">
                                                                <span className="text-[9px] font-black uppercase text-emerald-400">Presents</span>
                                                                <span className="text-xs font-black text-emerald-500">{challan.attendance?.stats?.presents || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-orange-500/10 p-2 rounded-xl mb-1.5 grayscale-[0.5] hover:grayscale-0 transition-all border border-orange-500/20">
                                                                <span className="text-[9px] font-black uppercase text-orange-400">Leaves</span>
                                                                <span className="text-xs font-black text-orange-500">{challan.attendance?.stats?.leaves || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-red-500/10 p-2 rounded-xl grayscale-[0.5] hover:grayscale-0 transition-all border border-red-500/20">
                                                                <span className="text-[9px] font-black uppercase text-red-400">Absents</span>
                                                                <span className="text-xs font-black text-red-500">{challan.attendance?.stats?.absents || 0}</span>
                                                            </div>
                                                            <div className="mt-2 text-[8px] font-bold text-center text-white/30 italic">
                                                                Marked {challan.attendance?.stats?.totalMarked || 0} times this month
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row Financial Tokens (High Density Insight) */}
                                        <div className="hidden xl:flex items-center gap-3">
                                            {Number(challan.fines || 0) > 0 && (
                                                <div className="flex flex-col items-center group/fine relative">
                                                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Fine</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-black text-orange-600/80 tracking-tighter italic">+{Number(challan.fines).toLocaleString()}</span>
                                                        {challan.fine_notes && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse cursor-help" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="bg-red-500 text-white text-[10px] font-bold border-none rounded-lg py-1 px-2">
                                                                        Notice: {challan.fine_notes}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {Number(challan.discount || 0) > 0 && (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Waiver</span>
                                                    <span className="text-[10px] font-black text-primary tracking-tighter italic">-{Number(challan.discount).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {Number(challan.arrears || 0) > 0 && (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Pending</span>
                                                    <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter italic">+{Number(challan.arrears).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 leading-none mb-1">Total Due</p>
                                                <p className="text-xs font-black text-foreground italic tracking-tight">Rs. {totalExpected.toLocaleString()}</p>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 mb-1 opacity-50">
                                                    {challan.payment_method && (
                                                        <Badge variant="outline" className="text-[7px] h-3 px-1 font-black uppercase tracking-widest bg-emerald-500/5 text-emerald-700/60 border-emerald-500/20">
                                                            {challan.payment_method}
                                                        </Badge>
                                                    )}
                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">Paid</p>
                                                </div>
                                                <p className="text-xs font-black text-emerald-600 italic tracking-tight">Rs. {paid.toLocaleString()}</p>
                                            </div>

                                            <div className="flex flex-col items-end justify-center min-w-[80px]">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1 opacity-50">Remaining</p>
                                                <div className={cn(
                                                    "text-xl font-black tracking-tighter italic leading-none",
                                                    remaining > 0 ? "text-orange-600" : "text-emerald-500"
                                                )}>
                                                    {remaining > 0 ? `Rs. ${remaining.toLocaleString()}` : "CLEARED"}
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                                                isOpen ? "gradient-toggle-btn text-white rotate-180" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                            )}>
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleTrigger>

                            <AnimatePresence>
                                {isOpen && (
                                    <CollapsibleContent forceMount asChild>
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6 pt-2">
                                                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-6" />

                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                                    {/* Financial Summary Cards */}
                                                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 group/card hover:border-primary/20 transition-colors">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Wallet className="w-3.5 h-3.5 text-primary/40 group-hover/card:text-primary transition-colors" />
                                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Monthly Fee</p>
                                                            </div>
                                                            <p className="text-sm font-black text-foreground tracking-tight">Rs. {Number(challan.amount_due).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 group/card hover:border-orange-500/20 transition-colors">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock className="w-3.5 h-3.5 text-orange-500/40 group-hover/card:text-orange-500 transition-colors" />
                                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Arrears/Pending</p>
                                                            </div>
                                                            <p className="text-sm font-black text-orange-600 tracking-tight">Rs. {Number(challan.arrears || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 group/card hover:border-blue-500/20 transition-colors">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <AlertCircle className="w-3.5 h-3.5 text-blue-500/40 group-hover/card:text-blue-500 transition-colors" />
                                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Late Fines</p>
                                                            </div>
                                                            <p className="text-sm font-black text-blue-600 tracking-tight">Rs. {Number(challan.fines || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 group/card hover:border-emerald-500/20 transition-colors">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <IndianRupee className="w-3.5 h-3.5 text-emerald-500/40 group-hover/card:text-emerald-500 transition-colors" />
                                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Adjustments</p>
                                                            </div>
                                                            <p className="text-sm font-black text-emerald-600 tracking-tight">- Rs. {Number(challan.discount || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    {/* Performance & Action */}
                                                    <div className="lg:col-span-5 flex items-center justify-between lg:justify-end gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                                        <div className="space-y-1 lg:mr-4">
                                                            <div className="flex items-center gap-2 text-primary">
                                                                <TrendingUp className="w-4 h-4" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Attendance</span>
                                                            </div>
                                                            <p className="text-xl font-black italic tracking-tighter text-primary flex items-center gap-3">
                                                                {(challan.attendance?.percentage || 0).toFixed(1)}%
                                                                <span className="text-[10px] not-italic font-bold text-primary/40 text-xs">Present</span>

                                                                {/* Dynamic Status Indicator (Trifecta Logic) */}
                                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-500">
                                                                    {isPaid ? (
                                                                        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-black uppercase tracking-[0.15em] text-[8px] gap-1 px-2.5 h-6 shadow-sm">
                                                                            <CheckCircle className="w-2.5 h-2.5" /> Paid
                                                                        </Badge>
                                                                    ) : challan.status === 'PARTIAL' || Number(challan.paid_amount) > 0 ? (
                                                                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-black uppercase tracking-[0.15em] text-[8px] gap-1 px-2.5 h-6 shadow-sm">
                                                                            <DollarSign className="w-2.5 h-2.5" /> Partial
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-zinc-500/10 text-muted-foreground border-border font-black uppercase tracking-[0.15em] text-[8px] gap-1 px-2.5 h-6 shadow-sm grayscale">
                                                                            <Clock className="w-2.5 h-2.5" /> Pending
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </p>

                                                            {/* Dynamic Print Button (Under Percentage) */}
                                                            {Number(challan.paid_amount) > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => { e.stopPropagation(); setPrintingChallan(challan); }}
                                                                    className="mt-2 h-8 px-3 rounded-lg font-black uppercase tracking-widest text-[9px] bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-500"
                                                                >
                                                                    <Printer className="w-3 h-3 mr-2" />
                                                                    Print Receipt
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <Button
                                                            size="lg"
                                                            disabled={isPaid}
                                                            onClick={(e) => { e.stopPropagation(); onCollectFee(challan); }}
                                                            className={cn(
                                                                "h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-xl shadow-primary/20 shrink-0",
                                                                isPaid ? "bg-muted hover:bg-muted text-muted-foreground shadow-none" : "bg-primary hover:bg-primary/90 text-primary-foreground font-black"
                                                            )}
                                                        >
                                                            <Receipt className="w-4 h-4 mr-2" />
                                                            {isPaid ? "Fully Paid" : "Collect Now"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-3">
                                                    {(challan.arrears_note || challan.paid_notes) && (
                                                        <div className="p-4 bg-muted/20 border border-border/30 rounded-xl flex gap-3">
                                                            <AlertCircle className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                                                            <p className="text-[11px] font-medium text-muted-foreground/80 italic leading-relaxed">
                                                                <span className="font-black text-foreground/40 uppercase not-italic mr-2">Admin note:</span>
                                                                {challan.arrears_note || challan.paid_notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {challan.fine_notes && (
                                                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex gap-3">
                                                            <AlertCircle className="w-4 h-4 text-red-500/40 mt-0.5 shrink-0" />
                                                            <p className="text-[11px] font-medium text-red-500/80 italic leading-relaxed">
                                                                <span className="font-black text-red-600/40 uppercase not-italic mr-2">Fine Notice:</span>
                                                                {challan.fine_notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </CollapsibleContent>
                                )}
                            </AnimatePresence>
                        </Collapsible>
                    );
                })}
            </div>

            {/* Pagination Footer */}
            {totalResults > 0 && (
                <div className="glass-card px-6 py-4 border rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                            Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{endIndex}</span> of <span className="text-foreground">{totalResults}</span> active records
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1.5 mx-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, array) => {
                                    const showEllipsis = idx > 0 && p !== array[idx - 1] + 1;
                                    return (
                                        <div key={p} className="flex items-center gap-1">
                                            {showEllipsis && <span className="text-muted-foreground/30 text-xs font-bold px-1">...</span>}
                                            <Button
                                                variant={currentPage === p ? 'default' : 'ghost'}
                                                size="sm"
                                                className={cn(
                                                    "h-9 w-9 p-0 rounded-xl font-black text-xs transition-all duration-300",
                                                    currentPage === p ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 pointer-events-none" : "text-muted-foreground hover:bg-primary/5"
                                                )}
                                                onClick={() => setCurrentPage(p)}
                                            >
                                                {p}
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Print Portal */}
            <FeePrintReceipt
                open={!!printingChallan}
                challan={printingChallan}
                onClose={() => setPrintingChallan(null)}
            />
        </div>
    );
}
