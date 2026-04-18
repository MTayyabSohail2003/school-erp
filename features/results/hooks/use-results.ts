import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultsApi } from '../api/results.api';
import { type ResultEntry } from '../schemas/results.schema';
import { toast } from 'sonner';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

const resultsKeys = {
    all: ['results'] as const,
    terms: ['exam-terms'] as const,
    students: (classId: string) => ['results', 'students', classId] as const,
    subjects: (classId: string) => ['results', 'subjects', classId] as const,
    studentResults: (termId: string, studentId: string) => ['results', 'student-results', termId, studentId] as const,
    classResults: (termId: string, classId: string) => ['results', 'class-results', termId, classId] as const,
    studentDetails: (studentId: string) => ['results', 'student-details', studentId] as const,
    termInstance: (name: string, year: string) => ['exam-terms', 'instance', name, year] as const,
};

export function useGetTerms() {
    useRealtimeInvalidate({ table: 'exam_terms', queryKey: resultsKeys.terms });
    return useQuery({
        queryKey: resultsKeys.terms,
        queryFn: resultsApi.getTerms,
    });
}

export function useGetStudentsByClass(classId: string) {
    return useQuery({
        queryKey: resultsKeys.students(classId),
        queryFn: () => resultsApi.getStudentsByClass(classId),
        enabled: !!classId,
    });
}

export function useGetSubjectsByClass(classId: string) {
    return useQuery({
        queryKey: resultsKeys.subjects(classId),
        queryFn: () => resultsApi.getSubjectsByClass(classId),
        enabled: !!classId,
    });
}

export function useGetStudentResults(termId: string, studentId: string) {
    useRealtimeInvalidate({ 
        table: 'exam_results', 
        queryKey: resultsKeys.studentResults(termId, studentId),
        filter: `student_id=eq.${studentId}`
    });
    return useQuery({
        queryKey: resultsKeys.studentResults(termId, studentId),
        queryFn: () => resultsApi.getResultsByTermAndStudent(termId, studentId),
        enabled: !!termId && !!studentId,
    });
}

export function useGetClassResults(termId: string, classId: string) {
    useRealtimeInvalidate({ 
        table: 'exam_results', 
        queryKey: resultsKeys.all
    });
    return useQuery({
        queryKey: resultsKeys.classResults(termId, classId),
        queryFn: () => resultsApi.getResultsByTermAndClass(termId, classId),
        enabled: !!termId && !!classId,
    });
}

export function useUpsertResults() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: resultsApi.upsertResults,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.all });
            toast.success('Results saved successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to save results');
        },
    });
}

export function useCreateTerm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: resultsApi.createTerm,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('Term registered successfully!');
        },
    });
}

export function useUpdateTerm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, term }: { id: string; term: any }) => resultsApi.updateTerm(id, term),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('Term updated successfully!');
        },
    });
}

export function useDeleteTerm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: resultsApi.deleteTerm,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resultsKeys.terms });
            toast.success('Term deleted successfully!');
        },
    });
}

export function useGetStudentDetails(studentId: string) {
    return useQuery({
        queryKey: resultsKeys.studentDetails(studentId),
        queryFn: () => resultsApi.getStudentDetails(studentId),
        enabled: !!studentId,
    });
}

export function useTermInstance(name?: string, year?: string) {
    useRealtimeInvalidate({ table: 'exam_terms', queryKey: resultsKeys.terms });
    return useQuery({
        queryKey: resultsKeys.termInstance(name || '', year || ''),
        queryFn: () => resultsApi.getTermInstance(name!, year!),
        enabled: !!name && !!year && year !== 'ALL',
    });
}
