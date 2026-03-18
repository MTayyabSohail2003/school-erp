'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, IndianRupee, HandCoins, AlertCircle, UserPlus } from 'lucide-react';
import { type DashboardStats } from '../../finance/api/fees-dashboard.api';
import { Skeleton } from '@/components/ui/skeleton';

export function FeeStatsCards({ stats, isLoading }: { stats?: DashboardStats, isLoading: boolean }) {
    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
        );
    }

    const items = [
        {
            title: 'Total Students',
            value: stats.totalStudents.toLocaleString(),
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Total Expected Fee',
            value: `Rs. ${stats.totalFee.toLocaleString()}`,
            icon: IndianRupee,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            title: 'Total Collected',
            value: `Rs. ${stats.totalCollected.toLocaleString()}`,
            icon: HandCoins,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            title: 'Total Pending',
            value: `Rs. ${stats.totalPending.toLocaleString()}`,
            icon: AlertCircle,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            title: 'New Students',
            value: stats.newStudentsThisMonth.toLocaleString(),
            icon: UserPlus,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                    <Card key={idx} className="border-none shadow-md overflow-hidden relative group">
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`w-16 h-16 ${item.color}`} />
                        </div>
                        <CardHeader className="pb-2 pt-5">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
                                {item.title}
                                <div className={`p-2 rounded-lg ${item.bg}`}>
                                    <Icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{item.value}</div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
