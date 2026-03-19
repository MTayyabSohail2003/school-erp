import { TeacherNoticeBoardPage } from '@/features/notices/components/teacher-notice-board';

export const metadata = {
    title: 'Notice Board | AR-School ERP',
    description: 'Teacher notice board with school announcements and leave summaries',
};

export default function TeacherNoticeBoardRoute() {
    return <TeacherNoticeBoardPage />;
}
