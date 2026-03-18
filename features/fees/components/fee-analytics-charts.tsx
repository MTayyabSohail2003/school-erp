'use client';

import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type MonthlyAnalytics } from '../../finance/api/fees-dashboard.api';
import { Skeleton } from '@/components/ui/skeleton';

export function FeeAnalyticsCharts({ data, isLoading }: { data?: MonthlyAnalytics[], isLoading: boolean }) {
    if (isLoading || !data) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
            </div>
        );
    }

    // Format data for better display
    const chartData = data.map(d => {
        const [year, month] = d.month.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return {
            ...d,
            displayMonth: date.toLocaleDateString('default', { month: 'short', year: '2-digit' })
        };
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Collection Chart */}
            <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold tracking-tight">Fee Collection</CardTitle>
                    <CardDescription>Amount collected over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.9}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.15}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.15} />
                                <XAxis 
                                    dataKey="displayMonth" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }}
                                    tickFormatter={(val) => `Rs.${val > 1000 ? (val/1000).toFixed(1)+'k' : val}`}
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: '1px solid var(--border)', 
                                        backgroundColor: 'var(--card)',
                                        color: 'var(--card-foreground)',
                                        boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)' 
                                    }}
                                    itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                                    formatter={(value: number | undefined) => [`Rs. ${(value || 0).toLocaleString()}`, 'Collected']}
                                />
                                <Bar 
                                    dataKey="collected" 
                                    fill="url(#colorCollected)" 
                                    radius={[6, 6, 0, 0]} 
                                    maxBarSize={45} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Admissions Chart */}
            <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold tracking-tight">Admissions</CardTitle>
                    <CardDescription>New students enrolled per month</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.7}/>
                                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.15} />
                                <XAxis 
                                    dataKey="displayMonth" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false} 
                                    allowDecimals={false}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: '1px solid var(--border)', 
                                        backgroundColor: 'var(--card)',
                                        color: 'var(--card-foreground)',
                                        boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)' 
                                    }}
                                    itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                                    formatter={(value: number | undefined) => [value || 0, 'New Students']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="students" 
                                    stroke="var(--chart-2)" 
                                    fillOpacity={1}
                                    fill="url(#colorStudents)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--background)', stroke: 'var(--chart-2)', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: 'var(--chart-2)', stroke: 'var(--background)', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
