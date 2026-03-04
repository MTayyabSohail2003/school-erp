'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition, StaggerList, StaggerItem } from '@/components/ui/motion';
import { CheckSquare, Edit3, ArrowUpRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/globals';
import { format } from 'date-fns';

export function TeacherDashboard({ profile }: { profile: any }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    const today = new Date();

    return (
        <PageTransition>
            <div className="space-y-7">
                {/* ── Greeting ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {greeting}, {firstName}! 👋
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Welcome to your teacher portal. Today is {format(today, 'EEEE, MMM dd')}.
                        </p>
                    </div>
                </div>

                {/* ── Daily Tasks ── */}
                <div>
                    <h2 className="text-base font-semibold mb-4 text-foreground">Your Daily Tasks</h2>
                    <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StaggerItem>
                            <motion.a
                                href={ROUTES.ATTENDANCE}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 p-5 cursor-pointer group h-full"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 text-blue-500 dark:text-blue-400">
                                    <CheckSquare className="h-6 w-6" />
                                </div>
                                <div className="mt-auto">
                                    <p className="font-semibold text-lg text-foreground group-hover:text-blue-500 transition-colors">
                                        Mark Attendance
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Record daily student attendance
                                    </p>
                                </div>
                                <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400" />
                            </motion.a>
                        </StaggerItem>

                        <StaggerItem>
                            <motion.a
                                href={ROUTES.MARKS}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 p-5 cursor-pointer group h-full"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 text-purple-500 dark:text-purple-400">
                                    <Edit3 className="h-6 w-6" />
                                </div>
                                <div className="mt-auto">
                                    <p className="font-semibold text-lg text-foreground group-hover:text-purple-500 transition-colors">
                                        Enter Exam Marks
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Evaluate and grade recent exams
                                    </p>
                                </div>
                                <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500 dark:text-purple-400" />
                            </motion.a>
                        </StaggerItem>

                        <StaggerItem>
                            <motion.a
                                href={ROUTES.STUDENTS}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 p-5 cursor-pointer group h-full"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 text-emerald-500 dark:text-emerald-400">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <div className="mt-auto">
                                    <p className="font-semibold text-lg text-foreground group-hover:text-emerald-500 transition-colors">
                                        View Students
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Access student profiles and data
                                    </p>
                                </div>
                                <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 dark:text-emerald-400" />
                            </motion.a>
                        </StaggerItem>
                    </StaggerList>
                </div>

                {/* ── Notice Board (Placeholder) ── */}
                <div className="pt-4">
                    <Card className="bg-muted/30 border-dashed border-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Announcements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No new announcements from the administration today.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTransition>
    );
}
