'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, LayoutGrid, ListFilter } from 'lucide-react';
import { AddResultTab } from './add-result-tab';

export function ResultsManagement() {
    const [activeTab, setActiveTab] = useState('add');

    return (
        <div className="space-y-6 container mx-auto py-6 max-w-7xl">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Result Management</h1>
                        <p className="text-muted-foreground text-sm font-medium">Manage student academic performances and terms.</p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50">
                        <TabsTrigger value="add" className="rounded-lg gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <PlusIcon className="w-4 h-4" />
                            Add Result
                        </TabsTrigger>
                        <TabsTrigger value="view" className="rounded-lg gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <ListFilter className="w-4 h-4" />
                            View Results
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="add" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    <AddResultTab />
                </TabsContent>

                <TabsContent value="view" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    <Card className="border-dashed border-2 bg-muted/20">
                        <CardContent className="h-48 flex items-center justify-center flex-col gap-2 text-muted-foreground">
                            <LayoutGrid className="h-8 w-8 opacity-20" />
                            <p className="font-bold text-sm uppercase tracking-widest opacity-40 italic">Result Viewer coming soon</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
