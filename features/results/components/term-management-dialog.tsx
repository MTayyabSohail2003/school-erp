'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { resultsApi } from '../api/results.api';
import { useGetTerms, useDeleteTerm, resultsKeys, useGetMetadataUsage } from '../hooks/use-results';
import { toast } from 'sonner';
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
    FolderOpen,
    Pencil,
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
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('New global term defined successfully!');
            setIsAdding(false);
            setNewTermName('');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create term');
        }
    });

    const { data: usage } = useGetMetadataUsage();

    const deleteByName = useMutation({
        mutationFn: (name: string) => resultsApi.deleteTermsByName(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('Global term deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete term');
        }
    });

    const [editingName, setEditingName] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [termToDelete, setTermToDelete] = useState<string | null>(null);

    const renameTerm = useMutation({
        mutationFn: ({ oldName, newName }: { oldName: string, newName: string }) => 
            resultsApi.updateTermNames(oldName.trim(), newName.toUpperCase().trim()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('Term renamed successfully across all academic years!');
            setEditingName(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to rename term');
        }
    });

    const deleteTerm = useDeleteTerm();

    // Unique names from all terms to show "Global" list
    const globalNames = Array.from(new Set(terms?.map(t => t.name) ?? [])).sort();

    const handleAdd = () => {
        if (!newTermName) return;
        createTerm.mutate(newTermName.toUpperCase().trim());
    };

    const handleStartEdit = (name: string) => {
        setEditingName(name);
        setEditValue(name);
    };

    const handleSaveEdit = (oldName: string) => {
        if (!editValue || editValue === oldName) {
            setEditingName(null);
            return;
        }
        renameTerm.mutate({ oldName, newName: editValue.toUpperCase().trim() });
    };

    const isTermUsed = (name: string) => {
        const relatedIds = terms?.filter(t => t.name === name).map(t => t.id) ?? [];
        return relatedIds.some(id => usage?.includes(id));
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
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-colors shrink-0">
                                            <FolderOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        {editingName === name ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input 
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-9 rounded-xl border-primary/30 font-bold uppercase"
                                                    autoFocus
                                                />
                                                <Button size="icon" className="h-9 w-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 shrink-0" onClick={() => handleSaveEdit(name)} disabled={renameTerm.isPending}>
                                                    {renameTerm.isPending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl shrink-0" onClick={() => setEditingName(null)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-bold text-sm tracking-tight uppercase">{name}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">System Global</p>
                                            </div>
                                        )}
                                    </div>
                                    {editingName !== name && (
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
                                                onClick={() => handleStartEdit(name)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>

                                            {!isTermUsed(name) && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive"
                                                    onClick={() => setTermToDelete(name)}
                                                    disabled={deleteByName.isPending}
                                                >
                                                    {deleteByName.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                </Button>
                                            )}

                                            <Badge variant="secondary" className="rounded-lg font-bold text-[10px] opacity-60">
                                                Reusable
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>

            <AlertDialog open={!!termToDelete} onOpenChange={(open) => !open && setTermToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium">
                            This will permanently delete the global term definition <strong className="text-foreground">"{termToDelete}"</strong> and remove it from all academic years. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold" disabled={deleteByName.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (termToDelete) {
                                    deleteByName.mutate(termToDelete, {
                                        onSuccess: () => setTermToDelete(null)
                                    });
                                }
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
                            disabled={deleteByName.isPending}
                        >
                            {deleteByName.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete Term
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
