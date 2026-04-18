'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetTerms, useCreateTerm, useUpdateTerm, useDeleteTerm } from '../hooks/use-results';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, 
    Trash2, 
    Pencil, 
    Loader2, 
    Calendar, 
    Check,
    X,
    CalendarDays
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface YearManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function YearManagementDialog({ open, onOpenChange }: YearManagementDialogProps) {
    const { data: terms, isLoading } = useGetTerms();
    const createTerm = useCreateTerm();
    const deleteTerm = useDeleteTerm();

    const [isAdding, setIsAdding] = useState(false);
    const [newYear, setNewYear] = useState('');

    // Unique years derived from existing terms
    const years = Array.from(new Set(terms?.map(t => t.academic_year) ?? [])).sort().reverse();

    const handleAddYear = () => {
        if (!newYear || newYear.length < 4) return;
        
        // Industry practice: When adding a year without a term, 
        // we create a placeholder 'ANNUAL' term to register the year in our system
        createTerm.mutate({
            name: 'Annual / Initial',
            academic_year: newYear,
            is_active: true
        }, {
            onSuccess: () => {
                setNewYear('');
                setIsAdding(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 pb-6 bg-muted/30 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                <CalendarDays className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Academic Years</DialogTitle>
                                <DialogDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-70"> Manage school sessions </DialogDescription>
                            </div>
                        </div>
                        <Button 
                            size="sm" 
                            variant="outline"
                            className="rounded-xl font-bold gap-2 border-primary/20 hover:bg-primary/5"
                            onClick={() => setIsAdding(true)}
                            disabled={isAdding}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    {isAdding && (
                        <div className="p-6 rounded-2xl border-2 border-indigo-500/20 bg-indigo-500/5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                             <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Register New Session</h3>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsAdding(false)}>
                                    <X className="w-3 h-3" />
                                </Button>
                             </div>
                             <div className="flex gap-3">
                                <Input 
                                    placeholder="e.g. 2025-26" 
                                    className="rounded-xl h-11 border-indigo-500/20 focus:ring-indigo-500/20"
                                    value={newYear}
                                    onChange={(e) => setNewYear(e.target.value)}
                                />
                                <Button className="rounded-xl h-11 px-5 font-bold gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleAddYear} disabled={createTerm.isPending}>
                                    {createTerm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Register
                                </Button>
                             </div>
                        </div>
                    )}

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                            </div>
                        ) : !years.length ? (
                            <div className="h-20 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <p className="text-sm font-medium">No sessions registered yet.</p>
                            </div>
                        ) : (
                            years.map((year) => (
                                <div 
                                    key={year} 
                                    className="flex items-center justify-between p-4 rounded-2xl border bg-card hover:border-indigo-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm tracking-widest uppercase italic">{year}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground opacity-60 uppercase">Active Session</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="rounded-lg border-indigo-100 bg-indigo-50/30 text-indigo-600 font-bold text-[10px]">
                                        Validated
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
