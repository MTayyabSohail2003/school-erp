'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { downloadCsv } from '@/utils/export-csv';
import { toast } from 'sonner';

interface ExportPayrollButtonProps {
    monthYear?: string; // 'YYYY-MM' | undefined = all months
}

export function ExportPayrollButton({ monthYear }: ExportPayrollButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const supabase = createClient();
            let query = supabase
                .from('staff_payroll_ledger')
                .select('month_year, amount_paid, bonus, fine, arrears, status, payment_method, notes, users(full_name, email, phone_number)')
                .order('month_year', { ascending: false });

            if (monthYear) {
                query = query.eq('month_year', monthYear);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);

            const rows = (data ?? []).map(r => ({
                'Month': r.month_year,
                'Staff Name': (r.users as any)?.full_name ?? '',
                'Email': (r.users as any)?.email ?? '',
                'Phone': (r.users as any)?.phone_number ?? '',
                'Net Paid (Rs.)': r.amount_paid ?? 0,
                'Bonus': r.bonus ?? 0,
                'Fine': r.fine ?? 0,
                'Arrears': r.arrears ?? 0,
                'Status': r.status,
                'Payment Method': r.payment_method ?? '',
                'Notes': r.notes ?? '',
            }));

            downloadCsv('payroll_export', rows);
            toast.success(`${rows.length} payroll records exported.`);
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
