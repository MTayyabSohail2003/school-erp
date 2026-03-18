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
import { IndianRupee } from 'lucide-react';

interface FeeChallanWithStudent {
    id: string;
    student_id?: string;
    amount_due: number;
    paid_amount: number;
    status: string;
    month_year: string;
    students: {
        full_name: string;
        roll_number: string;
        class_id: string;
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
        <div className="border rounded-xl bg-card overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(challan => {
                        const remaining = Number(challan.amount_due) - Number(challan.paid_amount || 0);
                        const isPaid = challan.status === 'PAID' || remaining <= 0;

                        return (
                            <TableRow key={challan.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="font-semibold">{challan.students?.full_name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{challan.students?.roll_number}</div>
                                </TableCell>
                                <TableCell>
                                    {challan.students?.classes?.name} - {challan.students?.classes?.section}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={isPaid ? 'secondary' : (challan.status === 'OVERDUE' ? 'destructive' : 'outline')} 
                                           className={isPaid ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""}>
                                        {isPaid ? 'PAID' : (Number(challan.paid_amount) > 0 ? 'PARTIAL' : challan.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    Rs. {Number(challan.amount_due).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-green-600 font-medium">
                                    Rs. {Number(challan.paid_amount || 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-orange-600 font-bold">
                                    Rs. {remaining > 0 ? remaining.toLocaleString() : 0}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button 
                                        size="sm" 
                                        variant={isPaid ? "outline" : "default"}
                                        className={`rounded-lg h-8 ${isPaid ? 'opacity-50' : 'shadow-md shadow-primary/20'}`}
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
