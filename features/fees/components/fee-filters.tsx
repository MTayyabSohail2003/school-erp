'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MonthPicker } from '@/components/ui/month-picker';
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
        <div className="bg-card/30 backdrop-blur-sm p-4 rounded-2xl border border-border/40 shadow-xl flex flex-wrap items-center gap-4 transition-all hover:bg-card/40">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px] group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search by student name or roll..." 
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-9 w-full bg-background/50 border-2 rounded-xl focus-visible:ring-primary/20 h-11 font-medium"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {/* Month Picker */}
                <MonthPicker
                    value={filters.monthYear}
                    onChange={(val) => updateFilter('monthYear', val)}
                    className="w-44 bg-background/50 border-2 rounded-xl h-11"
                />

                {/* Class Filter */}
                <Select value={filters.classId} onValueChange={(val) => updateFilter('classId', val)}>
                    <SelectTrigger className="w-40 bg-background/50 border-2 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest">
                        <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                        <SelectItem value="All">All Classes</SelectItem>
                        {uniqueClasses.map(([name, id]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Section Filter */}
                <Select value={filters.section} onValueChange={(val) => updateFilter('section', val)}>
                    <SelectTrigger className="w-32 bg-background/50 border-2 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest">
                        <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                        <SelectItem value="All">All Sections</SelectItem>
                        {sections.map(sec => (
                            <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filters.status} onValueChange={(val) => updateFilter('status', val)}>
                    <SelectTrigger className="w-40 bg-background/50 border-2 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="PARTIAL">Partial Payment</SelectItem>
                        <SelectItem value="PENDING">Pending (None)</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                </Select>

                {/* Reset Buttons */}
                <Button 
                    variant="ghost" 
                    className="h-10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors" 
                    onClick={() => onChange({
                        classId: 'All',
                        section: 'All',
                        status: 'All',
                        search: '',
                        monthYear: filters.monthYear
                    })}
                >
                    Reset
                </Button>
            </div>
        </div>
    );
}
