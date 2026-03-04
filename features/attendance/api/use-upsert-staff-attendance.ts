import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAttendanceApi } from './staff-attendance.api';
import { type StaffAttendanceRecord } from '../schemas/staff-attendance.schema';

export function useUpsertStaffAttendance(date: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (records: StaffAttendanceRecord[]) => staffAttendanceApi.upsertStaffAttendance(records),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-attendance', date] });
        },
    });
}
