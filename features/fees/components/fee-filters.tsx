'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface FeeFiltersState {
    classId: string;
    section: string;
    status: string;
    search: string;
    monthYear: string;
}

interface FeeFiltersProps {
    filters: FeeFiltersState;
    onChange: (filters: FeeFiltersState) => void;
}

export function FeeFilters({ filters, onChange }: FeeFiltersProps) {
    const { data: classes } = useQuery({
        queryKey: ['classes-list'],
        queryFn: async () => {
            const supabase = createClient();
            const { data } = await supabase.from('classes').select('*').order('name');
            return data ?? [];
        }
    });

    // Unique sections across all classes
    const sections = Array.from(new Set(classes?.map(c => c.section) || [])).sort();
    
    // Unique classes (ignoring sections for the dropdown name)
    const uniqueClassesMap = new Map();
    classes?.forEach(c => {
        if (!uniqueClassesMap.has(c.name)) {
            uniqueClassesMap.set(c.name, c.id);
        }
    });
    const uniqueClasses = Array.from(uniqueClassesMap.entries());

    const updateFilter = (key: keyof FeeFiltersState, value: string) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <div className="bg-card p-4 rounded-xl border shadow-sm sticky top-16 z-10 space-y-4 md:space-y-0 md:flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name or roll number..." 
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-9 w-full bg-background"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Month Picker */}
                <Input 
                    type="month" 
                    value={filters.monthYear}
                    onChange={(e) => updateFilter('monthYear', e.target.value)}
                    className="w-40 bg-background"
                />

                {/* Class Filter */}
                <Select value={filters.classId} onValueChange={(val) => updateFilter('classId', val)}>
                    <SelectTrigger className="w-36 bg-background">
                        <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Classes</SelectItem>
                        {uniqueClasses.map(([name, id]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Section Filter */}
                <Select value={filters.section} onValueChange={(val) => updateFilter('section', val)}>
                    <SelectTrigger className="w-32 bg-background">
                        <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Sections</SelectItem>
                        {sections.map(sec => (
                            <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filters.status} onValueChange={(val) => updateFilter('status', val)}>
                    <SelectTrigger className="w-36 bg-background">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="PENDING">Pending (Partial / None)</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                </Select>

                {/* Reset Buttons */}
                <Button variant="ghost" className="text-xs" onClick={() => onChange({
                    classId: 'All',
                    section: 'All',
                    status: 'All',
                    search: '',
                    monthYear: filters.monthYear
                })}>
                    Reset
                </Button>
            </div>
        </div>
    );
}
