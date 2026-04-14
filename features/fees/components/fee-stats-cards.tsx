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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.5, ease: 'easeOut' }}
                        whileHover={{ y: -5 }}
                        className="h-full"
                    >
                        <Card className={`h-full border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative group rounded-[2rem] transition-all duration-500 ${item.border}`}>
                            {/* Animated Background Glow */}
                            <div className={`absolute -right-10 -top-10 h-32 w-32 bg-gradient-to-br ${item.glow} rounded-full blur-3xl opacity-30 group-hover:opacity-100 transition-opacity duration-700`} />
                            <div className={`absolute -left-10 -bottom-10 h-24 w-24 bg-gradient-to-tr ${item.glow} rounded-full blur-3xl opacity-10 group-hover:opacity-40 transition-opacity duration-700`} />
                            
                            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${item.bg} backdrop-blur-sm border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                        <Icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 leading-none">{item.title}</span>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground group-hover:tracking-tight transition-all duration-500">
                                            {item.value}
                                        </span>
                                    </div>
                                    
                                    {item.extra && (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${collectionRate}%` }}
                                                    transition={{ delay: 0.5, duration: 1 }}
                                                    className={`h-full bg-gradient-to-r ${item.glow.replace('/20', '')}`} 
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-600/80 dark:text-emerald-400/80 whitespace-nowrap">
                                                {item.extra}
                                            </span>
                                        </div>
                                    )}

                                    {!item.extra && (
                                        <div className="pt-2 flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <TrendingUp className="h-3 w-3" />
                                            Active Record
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            
                            {/* Glow Line Indicator */}
                            <div className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${item.glow.replace('/20', '/40')} opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.2)]`} />
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
