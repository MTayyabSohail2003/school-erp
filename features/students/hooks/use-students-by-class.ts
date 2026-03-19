import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export interface StudentBasic {
    id: string;
    full_name: string;
    roll_number: string;
    photo_url?: string | null;
}

/**
 * Fetches active students belonging to a specific class.
 * Used in Attendance and Mark Sheet pages.
 */
export function useStudentsByClass(classId: string) {
    useRealtimeInvalidate({ table: 'students', queryKey: ['students', 'byClass', classId] });
    return useQuery({
        queryKey: ['students', 'byClass', classId],
        queryFn: async (): Promise<StudentBasic[]> => {
            if (!classId) return [];
            const supabase = createClient();
            const { data, error } = await supabase
                .from('students')
                .select('id, full_name, roll_number, photo_url')
                .eq('class_id', classId)
                .eq('status', 'ACTIVE')
                .order('roll_number', { ascending: true });
            if (error) throw new Error(error.message);
            return data as StudentBasic[];
        },
        enabled: Boolean(classId),
    });
}
