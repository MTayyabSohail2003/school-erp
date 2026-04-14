'use client';

import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, MessageSquare, AlertCircle, Clock, CheckCircle, Banknote, Landmark, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';

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
    if (isLoading) {
        return (
            <div className="border rounded-xl bg-card overflow-hidden">
                <div className="p-4 space-y-4">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="border rounded-xl bg-card p-12 text-center text-muted-foreground">
                No students found for the selected filters.
            </div>
        );
    }

    return (
        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black uppercase text-[10px] tracking-widest py-4">Student</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Class</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Attendance %</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Fine</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Waiver</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Prev. Pending</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Total Due</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Paid</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Method</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Remaining</TableHead>
                        <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(challan => {
                        const totalExpected = Number(challan.amount_due) + Number(challan.arrears || 0) + Number(challan.fines || 0) - Number(challan.discount || 0);
                        const paid = Number(challan.paid_amount || 0);
                        const remaining = totalExpected - paid;
                        const isPaid = challan.status === 'PAID' || remaining <= 0;
                        const isPartial = challan.status === 'PARTIAL' || (paid > 0 && remaining > 0);
                        const fines = Number(challan.fines || 0);
                        const discount = Number(challan.discount || 0);

                        return (
                            <TableRow key={challan.id} className="hover:bg-muted/30 transition-colors group">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <ImagePreviewDialog 
                                            src={challan.students?.photo_url} 
                                            title={challan.students?.full_name} 
                                            description={`Student ID: ${challan.students?.roll_number}`}
                                        >
                                            <Avatar className="h-9 w-9 border border-primary/10 transition-transform group-hover:scale-110 duration-300">
                                                {challan.students?.photo_url ? (
                                                    <AvatarImage src={challan.students.photo_url} className="object-cover" />
                                                ) : null}
                                                <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                                                    {challan.students?.full_name.charAt(0) || <User className="w-4 h-4" />}
                                                </AvatarFallback>
                                            </Avatar>
                                        </ImagePreviewDialog>
                                        <div>
                                            <div className="font-bold text-sm tracking-tight">{challan.students?.full_name}</div>
                                            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{challan.students?.roll_number}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm font-medium">{challan.students?.classes?.name}</div>
                                    <div className="text-[10px] text-muted-foreground font-bold">Section {challan.students?.classes?.section}</div>
                                </TableCell>
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-help group">
                                                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${challan.attendance?.percentage! >= 90 ? 'bg-emerald-500' : challan.attendance?.percentage! >= 75 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                            style={{ width: `${challan.attendance?.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-black group-hover:text-primary transition-colors">{Math.round(challan.attendance?.percentage || 0)}%</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="p-3 bg-zinc-900 border-zinc-800 text-white rounded-xl shadow-2xl">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-1.5">Student Attendance Breakdown</p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="flex flex-col text-center">
                                                            <span className="text-emerald-500 font-black text-sm">{challan.attendance?.stats.presents || 0}</span>
                                                            <span className="text-[9px] uppercase font-bold text-white/30">Pres</span>
                                                        </div>
                                                        <div className="flex flex-col text-center">
                                                            <span className="text-orange-500 font-black text-sm">{challan.attendance?.stats.leaves || 0}</span>
                                                            <span className="text-[9px] uppercase font-bold text-white/30">Lev</span>
                                                        </div>
                                                        <div className="flex flex-col text-center">
                                                            <span className="text-red-500 font-black text-sm">{challan.attendance?.stats.absents || 0}</span>
                                                            <span className="text-[9px] uppercase font-bold text-white/30">Abs</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-white/20 pt-1.5 italic border-t border-white/5">Marked {challan.attendance?.stats.totalMarked || 0} times this month</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                    {isPaid ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                                            <CheckCircle className="w-3 h-3" /> Paid
                                        </Badge>
                                    ) : isPartial ? (
                                        <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                                            <Clock className="w-3 h-3" /> Partial
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                                            <AlertCircle className="w-3 h-3" /> Pending
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-black text-xs ${fines > 0 ? 'text-blue-600 italic' : 'text-muted-foreground/20'}`}>
                                        {fines > 0 ? `+Rs. ${fines.toLocaleString()}` : '—'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-black text-xs ${discount > 0 ? 'text-emerald-600 italic' : 'text-muted-foreground/20'}`}>
                                        {discount > 0 ? `-Rs. ${discount.toLocaleString()}` : '—'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={`font-black text-sm ${Number(challan.arrears) > 0 ? 'text-orange-600' : 'text-muted-foreground/30 text-xs'}`}>
                                            {Number(challan.arrears) > 0 ? `Rs. ${Number(challan.arrears).toLocaleString()}` : '—'}
                                        </span>
                                        {Number(challan.arrears) > 0 && <span className="text-[9px] font-bold text-muted-foreground uppercase text-[8px] italic">Historical Debt</span>}
                                        
                                        {challan.arrears_note && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold italic mt-0.5 max-w-[100px] truncate">
                                                        <MessageSquare className="w-2.5 h-2.5" /> Note attached
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-zinc-900 text-white border-none rounded-xl p-3 shadow-2xl max-w-xs">
                                                        <p className="text-xs font-medium leading-relaxed italic">"{challan.arrears_note}"</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-black text-sm text-zinc-900 dark:text-zinc-100 italic tracking-tight">Rs. {totalExpected.toLocaleString()}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end hover:scale-105 transition-transform origin-right">
                                        <span className="text-emerald-600 font-black text-sm">Rs. {paid.toLocaleString()}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        {challan.payment_method ? (
                                            <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                                                {challan.payment_method === 'CASH' && <Banknote className="w-3 h-3 text-muted-foreground" />}
                                                {challan.payment_method === 'BANK' && <Landmark className="w-3 h-3 text-muted-foreground" />}
                                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                                                    {challan.payment_method}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/30 text-[10px] font-bold tracking-widest">—</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={`font-black text-sm ${remaining > 0 ? 'text-orange-600' : 'text-muted-foreground/30 text-xs'}`}>
                                            {remaining > 0 ? `Rs. ${remaining.toLocaleString()}` : 'Cleared'}
                                        </span>
                                        <div className="flex flex-col items-end gap-1 mt-1">
                                            {challan.fine_notes && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger className="flex items-center gap-1 text-[8px] text-blue-600 font-bold italic max-w-[100px] truncate">
                                                            <AlertCircle className="w-2.5 h-2.5" /> Fine: {challan.fine_notes}
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-blue-900 text-white border-none rounded-xl p-3 shadow-2xl max-w-xs">
                                                            <p className="text-xs font-medium leading-relaxed">"{challan.fine_notes}"</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {challan.paid_notes && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold italic max-w-[100px] truncate">
                                                            <CheckCircle className="w-2.5 h-2.5" /> Note: {challan.paid_notes}
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-zinc-900 text-white border-none rounded-xl p-3 shadow-2xl max-w-xs">
                                                            <p className="text-xs font-medium leading-relaxed italic">"{challan.paid_notes}"</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button 
                                        size="sm" 
                                        variant={isPaid ? "outline" : "default"}
                                        className={`rounded-lg h-8 transition-all active:scale-95 ${isPaid ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-md shadow-primary/20 hover:shadow-lg'}`}
                                        disabled={isPaid}
                                        onClick={() => onCollectFee(challan)}
                                    >
                                        <IndianRupee className="w-4 h-4 mr-1" />
                                        Collect
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
