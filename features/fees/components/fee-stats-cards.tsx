'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Users, IndianRupee, HandCoins, AlertCircle, UserPlus, TrendingUp } from 'lucide-react';
import { type DashboardStats } from '../../finance/api/fees-dashboard.api';
import { Skeleton } from '@/components/ui/skeleton';

export function FeeStatsCards({ stats, isLoading }: { stats?: DashboardStats, isLoading: boolean }) {
    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-3xl border-2 border-dashed border-muted" />
                ))}
            </div>
        );
    }

    const collectionRate = stats.totalFee > 0 ? (stats.totalCollected / stats.totalFee) * 100 : 0;

    const items = [
        {
            title: 'Total Students',
            value: stats.totalStudents.toLocaleString(),
            icon: Users,
            color: 'text-blue-500',
            glow: 'from-blue-500/20 to-transparent',
            bg: 'bg-blue-500/10',
            border: 'hover:border-blue-500/30'
        },
        {
            title: 'Total Expected (Liability)',
            value: `Rs. ${stats.totalFee.toLocaleString()}`,
            icon: IndianRupee,
            color: 'text-purple-500',
            glow: 'from-purple-500/20 to-transparent',
            bg: 'bg-purple-500/10',
            border: 'hover:border-purple-500/30'
        },
        {
            title: 'Total Collected',
            value: `Rs. ${stats.totalCollected.toLocaleString()}`,
            icon: HandCoins,
            color: 'text-emerald-500',
            glow: 'from-emerald-500/20 to-transparent',
            bg: 'bg-emerald-500/10',
            border: 'hover:border-emerald-500/30',
            extra: `${collectionRate.toFixed(1)}% Collected`
        },
        {
            title: 'Total Pending',
            value: `Rs. ${stats.totalPending.toLocaleString()}`,
            icon: AlertCircle,
            color: 'text-orange-500',
            glow: 'from-orange-500/20 to-transparent',
            bg: 'bg-orange-500/10',
            border: 'hover:border-orange-500/30'
        },
        {
            title: 'New Students',
            value: stats.newStudentsThisMonth.toLocaleString(),
            icon: UserPlus,
            color: 'text-pink-500',
            glow: 'from-pink-500/20 to-transparent',
            bg: 'bg-pink-500/10',
            border: 'hover:border-pink-500/30'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -2 }}
                        className="h-full"
                    >
                        <Card className={`h-full border border-border/40 bg-zinc-900/40 dark:bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden relative group rounded-2xl transition-all duration-300 ${item.border} hover:shadow-primary/5`}>
                            <CardContent className="p-4 flex items-center gap-4 h-full relative z-10">
                                <div className={`p-3 rounded-xl ${item.bg} backdrop-blur-sm border border-white/10 shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                                    <Icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">{item.title}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-lg sm:text-xl font-black tracking-tighter text-foreground whitespace-nowrap">
                                            {item.value}
                                        </h3>
                                        {item.extra && (
                                            <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap">
                                                {collectionRate.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                    
                                    {item.extra && (
                                        <div className="mt-2 h-1 w-full bg-muted/40 rounded-full overflow-hidden border border-white/5 relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${collectionRate}%` }}
                                                transition={{ delay: 0.5, duration: 1.5, ease: "circOut" }}
                                                className={`h-full bg-gradient-to-r ${item.glow.replace('/20', '')} shadow-[0_0_10px_rgba(16,185,129,0.3)] relative z-10`}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
