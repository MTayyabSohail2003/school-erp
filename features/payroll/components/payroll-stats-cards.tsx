'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Landmark, ReceiptText, AlertCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PayrollStatsCards({ data, isLoading }: { data?: any[], isLoading: boolean }) {
    if (isLoading || !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-3xl border-2 border-dashed border-muted" />
                ))}
            </div>
        );
    }

    // Calculations
    const totalLiability = data.reduce((acc, r) => {
        const recordLiability = r.base_salary + r.historicalArrears + (r.ledger?.bonus || 0) - (r.ledger?.fine || 0);
        return acc + recordLiability;
    }, 0);

    const totalPaid = data.reduce((acc, r) => acc + (r.ledger?.net_paid || 0), 0);
    const totalPending = totalLiability - totalPaid;

    const stats = [
        {
            title: 'Monthly Liability',
            value: `Rs. ${totalLiability.toLocaleString()}`,
            icon: ReceiptText,
            color: 'text-purple-500',
            glow: 'from-purple-500/20 to-transparent',
            bg: 'bg-purple-500/10',
            border: 'hover:border-purple-500/30'
        },
        {
            title: 'Total Disbursed',
            value: `Rs. ${totalPaid.toLocaleString()}`,
            icon: Landmark,
            color: 'text-emerald-500',
            glow: 'from-emerald-500/20 to-transparent',
            bg: 'bg-emerald-500/10',
            border: 'hover:border-emerald-500/30'
        },
        {
            title: 'Pending Payouts',
            value: `Rs. ${totalPending.toLocaleString()}`,
            icon: AlertCircle,
            color: 'text-orange-500',
            glow: 'from-orange-500/20 to-transparent',
            bg: 'bg-orange-500/10',
            border: 'hover:border-orange-500/30'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.map((item, idx) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        whileHover={{ y: -5 }}
                    >
                        <Card className={`h-full border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative group rounded-[2rem] transition-all duration-500 ${item.border}`}>
                            <div className={`absolute -right-10 -top-10 h-32 w-32 bg-gradient-to-br ${item.glow} rounded-full blur-3xl opacity-30 group-hover:opacity-100 transition-opacity duration-700`} />
                            
                            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${item.bg} backdrop-blur-sm border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                        <Icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">{item.title}</span>
                                </div>
                                
                                <div className="space-y-1">
                                    <span className="text-3xl font-black tracking-tighter text-foreground group-hover:tracking-tight transition-all duration-500">
                                        {item.value}
                                    </span>
                                    <div className="pt-2 flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrendingUp className="h-3 w-3" />
                                        Monthly Budget
                                    </div>
                                </div>
                            </CardContent>
                            <div className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${item.glow.replace('/20', '/40')} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
