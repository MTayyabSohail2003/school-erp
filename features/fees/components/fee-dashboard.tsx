'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
    useFeeDashboardStats, 
    useFeeAnalytics, 
    useFeeStudents,
    useFeesRealtime
} from '../../finance/api/use-fees-dashboard';
import { FeeStatsCards } from './fee-stats-cards';
import { FeeFilters, type FeeFiltersState } from './fee-filters';
import { FeeStudentsTable } from './fee-students-table';
import { FeeCollectModal, type DashboardChallan } from './fee-collect-modal';
import { FeeAnalyticsCharts } from './fee-analytics-charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletCards, Activity } from 'lucide-react';

export function FeeDashboard() {
    // Enable global realtime connection 
    useFeesRealtime();

    const currentMonth = format(new Date(), 'yyyy-MM');
    const [filters, setFilters] = useState<FeeFiltersState>({
        classId: 'All',
        section: 'All',
        status: 'All',
        search: '',
        monthYear: currentMonth
    });

    const [selectedChallan, setSelectedChallan] = useState<DashboardChallan | null>(null);

    // Queries
    const { data: stats, isLoading: isLoadingStats } = useFeeDashboardStats(filters.monthYear);
    const { data: studentsData, isLoading: isLoadingStudents } = useFeeStudents(filters.monthYear, filters);
    
    // Last 6 months for analytics
    const pastMonths = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return format(d, 'yyyy-MM');
    }).reverse();
    
    const { data: analyticsData, isLoading: isLoadingAnalytics } = useFeeAnalytics(pastMonths);

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
            <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <WalletCards className="w-8 h-8 text-primary" />
                    Fees Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Manage and track student fee collections intelligently</p>
            </div>

            {/* Top Level Stats */}
            <FeeStatsCards stats={stats} isLoading={isLoadingStats} />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted inline-flex h-auto p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg px-6 py-2.5 text-sm font-medium data-[state=active]:shadow-sm">
                        <Activity className="w-4 h-4 mr-2 inline-block" />
                        Overview Data
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="rounded-lg px-6 py-2.5 text-sm font-medium data-[state=active]:shadow-sm">
                        Students & Collections
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0">
                    <FeeAnalyticsCharts data={analyticsData} isLoading={isLoadingAnalytics} />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4 mt-0">
                    {/* Filters Bar */}
                    <FeeFilters filters={filters} onChange={setFilters} />
                    
                    {/* Data List */}
                    <FeeStudentsTable 
                        data={studentsData || []} 
                        isLoading={isLoadingStudents} 
                        onCollectFee={(challan) => setSelectedChallan(challan)} 
                    />
                </TabsContent>
            </Tabs>

            {/* Collect Modal */}
            <FeeCollectModal 
                key={selectedChallan?.id || 'empty-modal'}
                challan={selectedChallan} 
                open={!!selectedChallan} 
                onOpenChange={(isOpen) => !isOpen && setSelectedChallan(null)} 
            />
        </div>
    );
}
