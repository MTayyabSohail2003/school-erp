'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetTerms, useDeleteTerm } from '../hooks/use-results';
import { resultsApi } from '../api/results.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    Trash2, 
    Loader2, 
    BookOpen, 
    Check,
    X,
    FolderOpen
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TermManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TermManagementDialog({ open, onOpenChange }: TermManagementDialogProps) {
    const { data: terms, isLoading } = useGetTerms();
    const queryClient = useQueryClient();

    const [isAdding, setIsAdding] = useState(false);
    const [newTermName, setNewTermName] = useState('');

    const createTerm = useMutation({
        mutationFn: (name: string) => resultsApi.createTerm({ name, academic_year: 'GLOBAL', is_active: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exam-terms'] });
            setIsAdding(false);
            setNewTermName('');
        }
    });

    const deleteTerm = useDeleteTerm();

    // Unique names from all terms to show "Global" list
    const globalNames = Array.from(new Set(terms?.map(t => t.name) ?? [])).sort();

    const handleAdd = () => {
        if (!newTermName) return;
        createTerm.mutate(newTermName);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 pb-6 bg-muted/30 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Term Definitions</DialogTitle>
                                <DialogDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-70"> Global result terms </DialogDescription>
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
                        <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                             <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Define New Term</h3>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsAdding(false)}>
                                    <X className="w-3 h-3" />
                                </Button>
                             </div>
                             <div className="flex gap-3">
                                <Input 
                                    placeholder="e.g. Mid-Term" 
                                    className="rounded-xl h-11 border-primary/20 focus:ring-primary/20"
                                    value={newTermName}
                                    onChange={(e) => setNewTermName(e.target.value)}
                                />
                                <Button className="rounded-xl h-11 px-5 font-bold gap-2" onClick={handleAdd} disabled={createTerm.isPending}>
                                    {createTerm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Create
                                </Button>
                             </div>
                        </div>
                    )}

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                            </div>
                        ) : !globalNames.length ? (
                            <div className="h-20 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <p className="text-sm font-medium">No terms defined yet.</p>
                            </div>
                        ) : (
                            globalNames.map((name) => (
                                <div 
                                    key={name} 
                                    className="flex items-center justify-between p-4 rounded-2xl border bg-card hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                            <FolderOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{name}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">System Global</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="rounded-lg font-bold text-[10px] opacity-60">
                                        Reusable
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
