'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetTerms, useCreateTerm, useUpdateTerm, useDeleteTerm, useGetMetadataUsage, resultsKeys } from '../hooks/use-results';
import { resultsApi } from '../api/results.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
    CalendarDays,
    Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface YearManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function YearManagementDialog({ open, onOpenChange }: YearManagementDialogProps) {
    const { data: terms, isLoading } = useGetTerms();
    const queryClient = useQueryClient();
    const createTerm = useCreateTerm();
    
    const { data: usage } = useGetMetadataUsage();

    const deleteByYear = useMutation({
        mutationFn: (year: string) => resultsApi.deleteTermsByYear(year),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('Academic year deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete year');
        }
    });

    const [editingYear, setEditingYear] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [yearToDelete, setYearToDelete] = useState<string | null>(null);

    const renameYear = useMutation({
        mutationFn: ({ oldYear, newYear }: { oldYear: string, newYear: string }) => 
            resultsApi.updateAcademicYear(oldYear, newYear),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('Session renamed successfully across all associated terms!');
            setEditingYear(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to rename session');
        }
    });

    const [isAdding, setIsAdding] = useState(false);
    const [newYear, setNewYear] = useState('');

    // Unique years derived from existing terms
    const years = Array.from(new Set(terms?.map(t => t.academic_year) ?? [])).sort().reverse();

    const handleAddYear = () => {
        if (!newYear || newYear.length < 4) return;
        
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

    const isYearUsed = (year: string) => {
        const relatedIds = terms?.filter(t => t.academic_year === year).map(t => t.id) ?? [];
        return relatedIds.some(id => usage?.includes(id));
    };

    const handleStartEdit = (year: string) => {
        setEditingYear(year);
        setEditValue(year);
    };

    const handleSaveEdit = (oldYear: string) => {
        if (!editValue || editValue === oldYear) {
            setEditingYear(null);
            return;
        }
        renameYear.mutate({ oldYear, newYear: editValue.toUpperCase().trim() });
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
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Calendar className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        {editingYear === year ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input 
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-9 rounded-xl border-indigo-500/30 font-black uppercase italic"
                                                    autoFocus
                                                />
                                                <Button size="icon" className="h-9 w-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 shrink-0" onClick={() => handleSaveEdit(year)} disabled={renameYear.isPending}>
                                                    {renameYear.isPending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl shrink-0" onClick={() => setEditingYear(null)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-black text-sm tracking-widest uppercase italic">{year}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground opacity-60 uppercase">Active Session</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingYear !== year && (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 text-indigo-600"
                                                    onClick={() => handleStartEdit(year)}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                {!isYearUsed(year) && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive"
                                                        onClick={() => setYearToDelete(year)}
                                                        disabled={deleteByYear.isPending}
                                                    >
                                                        {deleteByYear.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        <Badge variant="outline" className="rounded-lg border-indigo-100 bg-indigo-50/30 text-indigo-600 font-bold text-[10px] shrink-0">
                                            {isYearUsed(year) ? 'In Use' : 'Validated'}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>

            <AlertDialog open={!!yearToDelete} onOpenChange={(open) => !open && setYearToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium">
                            This will permanently delete the <strong className="text-foreground">"{yearToDelete}"</strong> session and remove all its associated result terms. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold" disabled={deleteByYear.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (yearToDelete) {
                                    deleteByYear.mutate(yearToDelete, {
                                        onSuccess: () => setYearToDelete(null)
                                    });
                                }
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
                            disabled={deleteByYear.isPending}
                        >
                            {deleteByYear.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete Session
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
