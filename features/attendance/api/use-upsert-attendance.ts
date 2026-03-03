import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from './attendance.api';
import { type AttendanceRecord } from '../schemas/attendance.schema';
import { ATTENDANCE_QUERY_KEY } from './use-get-attendance';

export const useUpsertAttendance = (classId: string, date: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (records: AttendanceRecord[]) => attendanceApi.upsertAttendance(records),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY(classId, date) });
        },
    });
};
