'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { downloadCsv } from '@/utils/export-csv';
import { toast } from 'sonner';

interface ExportFeesButtonProps {
    monthYear?: string; // 'YYYY-MM' | undefined = all months
}

export function ExportFeesButton({ monthYear }: ExportFeesButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const supabase = createClient();
            let query = supabase
                .from('fee_challans')
                .select('month_year, amount_due, paid_amount, fines, discount, arrears, status, payment_method, students(full_name, roll_number, classes(name, section))')
                .order('month_year', { ascending: false });

            if (monthYear) {
                query = query.eq('month_year', monthYear);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);

            const rows = (data ?? []).map(c => ({
                'Month': c.month_year,
                'Student Name': (c.students as any)?.full_name ?? '',
                'Roll Number': (c.students as any)?.roll_number ?? '',
                'Class': (c.students as any)?.classes?.name ?? '',
                'Section': (c.students as any)?.classes?.section ?? '',
                'Amount Due': c.amount_due,
                'Paid Amount': c.paid_amount ?? 0,
                'Arrears': c.arrears ?? 0,
                'Fines': c.fines ?? 0,
                'Discount': c.discount ?? 0,
                'Status': c.status,
                'Payment Method': c.payment_method ?? '',
            }));

            downloadCsv('fee_challans_export', rows);
            toast.success(`${rows.length} challan records exported.`);
        } catch (err: any) {
            toast.error(err.message || 'Export failed.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
        >
            {isExporting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
            Export CSV
        </Button>
    );
}
