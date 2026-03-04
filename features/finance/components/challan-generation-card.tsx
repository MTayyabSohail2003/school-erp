'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Play, Loader2, Sparkles } from 'lucide-react';

import { useGenerateChallans } from '../api/use-challans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ChallanGenerationCard() {
    // Default to current month based on real date
    const today = new Date();
    const currentMonth = format(today, 'yyyy-MM');

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const generateMutation = useGenerateChallans();

    const handleGenerate = () => {
        generateMutation.mutate(selectedMonth, {
            onSuccess: (data: any) => {
                if (data.count === 0) {
                    toast.info(data.message);
                } else {
                    toast.success(data.message);
                }
            },
            onError: (err: any) => toast.error(err.message),
        });
    };

    // Generate options for the last 2 months + current + next 3 months to be flexible
    const monthOptions = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - 2 + i, 1);
        return {
            value: format(d, 'yyyy-MM'),
            label: format(d, 'MMMM yyyy'),
        };
    });

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Auto-Generate Challans
                </CardTitle>
                <CardDescription>
                    Automatically generate fee slips for all students based on their class fee structure. Duplicates are skipped.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Month</label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending || !selectedMonth}
                        className="w-full sm:w-auto"
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4 mr-2" />
                        )}
                        Generate Now
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
