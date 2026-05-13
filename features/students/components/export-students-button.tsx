'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { downloadCsv } from '@/utils/export-csv';
import { toast } from 'sonner';

interface ExportStudentsButtonProps {
    status?: 'ACTIVE' | 'GRADUATED' | 'ALL';
}

export function ExportStudentsButton({ status = 'ALL' }: ExportStudentsButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const supabase = createClient();
            let query = supabase
                .from('students')
                .select('full_name, roll_number, date_of_birth, status, academic_year, classes(name, section), users!students_parent_id_fkey(full_name, phone_number)')
                .order('roll_number', { ascending: true });

            if (status !== 'ALL') {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);

            const rows = (data ?? []).map(s => ({
                'Full Name': s.full_name,
                'Roll Number': s.roll_number,
                'Date of Birth': s.date_of_birth ?? '',
                'Class': (s.classes as any)?.name ?? '',
                'Section': (s.classes as any)?.section ?? '',
                'Status': s.status,
                'Academic Year': s.academic_year ?? '',
                'Parent/Guardian': (s.users as any)?.full_name ?? '',
                'Parent Phone': (s.users as any)?.phone_number ?? '',
            }));

            downloadCsv('students_export', rows);
            toast.success(`${rows.length} student records exported.`);
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
