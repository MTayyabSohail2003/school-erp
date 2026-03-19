import { useQuery } from '@tanstack/react-query';
import { classesApi } from '../api/classes.api';
import { useAuthProfile } from '@/features/auth/hooks/use-auth';
import { classKeys } from './use-classes';

export function useTeacherClasses() {
    const { data: profile } = useAuthProfile();
    const teacherId = profile?.id;
    const isTeacher = profile?.role === 'TEACHER';

    return useQuery({
        queryKey: isTeacher ? [...classKeys.all, 'teacher', teacherId] : classKeys.all,
        queryFn: async () => {
            if (isTeacher && teacherId) {
                return classesApi.getTeacherClasses(teacherId);
            }
            // Defaults to all classes for Admin or if not a teacher
            return classesApi.getClasses();
        },
        enabled: Boolean(profile),
    });
}
