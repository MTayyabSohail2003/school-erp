'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { Staff } from '../schemas/staff.schema';
import { subjectsApi, type Subject } from '@/features/subjects/api/subjects.api';
import { useGetTeacherSubjects, useAssignTeacherSubjects } from '../api/use-teacher-subjects';
import { sendNotification } from '@/features/notifications/utils/notification.utils';


interface AssignSubjectsDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    teacher: Staff | null;
}

export function AssignSubjectsDialog({ isOpen, setIsOpen, teacher }: AssignSubjectsDialogProps) {
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
    const assignMutation = useAssignTeacherSubjects();

    // Fetch all available subjects in the school
    const { data: allSubjects, isLoading: isLoadingSubjects } = useQuery({
        queryKey: ['subjects'],
        queryFn: subjectsApi.getSubjects
    });

    // Fetch this specific teacher's assigned subjects
    const { data: teacherSubjects, isLoading: isLoadingAssigned } = useGetTeacherSubjects(teacher?.id || '');

    // Pre-fill checkboxes when teacher data loads
    useEffect(() => {
        if (teacherSubjects && isOpen) {
            setSelectedSubjectIds(teacherSubjects.map(ts => ts.subject_id));
        } else if (!isOpen) {
            setSelectedSubjectIds([]);
        }
    }, [teacherSubjects, isOpen]);

    const handleToggleSubject = (subjectId: string, checked: boolean) => {
        if (checked) {
            setSelectedSubjectIds(prev => [...prev, subjectId]);
        } else {
            setSelectedSubjectIds(prev => prev.filter(id => id !== subjectId));
        }
    };

    const handleSave = () => {
        if (!teacher || !teacher.id) return;
        assignMutation.mutate({
            teacherId: teacher.id as string,
            subjectIds: selectedSubjectIds
        }, {
            onSuccess: async () => {
                toast.success('Subjects successfully linked to teacher.');
                // Notify the assigned teacher
                await sendNotification({
                    recipientId: teacher.id as string,
                    title: 'Subject Assignment Updated',
                    message: 'Your assigned subjects have been updated. Please check your timetable for the latest schedule.',
                    type: 'INFO',
                    link: '/dashboard/timetable',
                });
                setIsOpen(false);
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to assign subjects.');
            }
        });
    };

    const isWorking = isLoadingSubjects || isLoadingAssigned;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Assign Subjects
                    </DialogTitle>
                    <DialogDescription>
                        Select the subjects that <strong>{teacher?.full_name}</strong> will teach.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-4">
                    {isWorking ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
                            <span className="text-sm text-muted-foreground">Loading subjects...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {allSubjects && allSubjects.length > 0 ? (
                                allSubjects.map((subject: Subject) => (
                                    <div key={subject.id} className="flex flex-row items-center space-x-3 p-3 border rounded-md hover:bg-muted/30 transition-colors">
                                        <Checkbox
                                            id={`subject-${subject.id}`}
                                            checked={selectedSubjectIds.includes(subject.id)}
                                            onCheckedChange={(checked: boolean) => handleToggleSubject(subject.id, checked)}
                                        />
                                        <div className="flex flex-col flex-1 leading-none">
                                            <Label htmlFor={`subject-${subject.id}`} className="text-sm font-medium cursor-pointer">
                                                {subject.name}
                                            </Label>
                                            {subject.code && (
                                                <p className="text-xs text-muted-foreground mt-1">Code: {subject.code}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No subjects found in the system. Please add subjects first.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 border-t pt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={assignMutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={assignMutation.isPending || isWorking}>
                        {assignMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : 'Save Assignments'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
