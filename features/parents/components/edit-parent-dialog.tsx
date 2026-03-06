'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { editParentAction } from '@/features/parents/api/edit-parent.action';
import { ParentUser } from '@/features/parents/api/use-get-parents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, Loader2 } from 'lucide-react';

interface EditParentDialogProps {
    parent: ParentUser;
}

export function EditParentDialog({ parent }: EditParentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        full_name: parent.full_name || '',
        email: parent.email || '',
        phone_number: parent.phone_number || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await editParentAction({
                id: parent.id,
                ...formData
            });

            if (!res.success) {
                throw new Error(res.error);
            }

            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ['parents'] });
            setOpen(false);
        } catch (error: unknown) {
            toast.error((error as Error).message || 'Failed to update parent.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (newOpen) {
                // Reset form to latest prop data when opening
                setFormData({
                    full_name: parent.full_name || '',
                    email: parent.email || '',
                    phone_number: parent.phone_number || '',
                });
            }
            setOpen(newOpen);
        }}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Edit className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Parent Profile</DialogTitle>
                    <DialogDescription>
                        Update contact details or name. Changes to email will affect their login access.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit_full_name">Full Name</Label>
                        <Input
                            id="edit_full_name"
                            required
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit_email">Email Address</Label>
                        <Input
                            id="edit_email"
                            type="email"
                            required
                            placeholder="johndoe@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit_phone_number">Phone Number</Label>
                        <Input
                            id="edit_phone_number"
                            required
                            placeholder="0300 1234567"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 text-right">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
