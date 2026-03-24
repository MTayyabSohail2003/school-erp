'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

interface PasswordConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    onConfirm: (password: string) => Promise<void>;
}

export function PasswordConfirmDialog({
    isOpen,
    onOpenChange,
    title,
    description,
    onConfirm,
}: PasswordConfirmDialogProps) {
    const [password, setPassword] = React.useState('');
    const [isPending, setIsPending] = React.useState(false);

    // Reset password field when dialog closes
    React.useEffect(() => {
        if (!isOpen) setPassword('');
    }, [isOpen]);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setIsPending(true);
        try {
            await onConfirm(password);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={isPending ? undefined : onOpenChange}>
            <AlertDialogContent className="border-red-500/20 bg-background/95 backdrop-blur-lg">
                <form onSubmit={handleConfirm}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 pt-2 text-foreground">
                                {description}
                                <div className="space-y-2 pt-2">
                                    <label htmlFor="confirm-password" className="text-sm font-medium">
                                        Admin Password
                                    </label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Enter your login password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isPending}
                                        required
                                        className="border-destructive/30 focus-visible:ring-destructive/50"
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isPending || !password}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Force Delete'
                            )}
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
