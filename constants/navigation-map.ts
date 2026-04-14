import { ROUTES } from "@/constants/globals";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  AlertTriangle, 
  CalendarDays, 
  Briefcase, 
  User, 
  WalletCards, 
  Megaphone,
  Settings,
  Bell,
  LucideIcon
} from 'lucide-react';

export type NavMapItem = {
    title: string;
    path: string;
    keywords: string[];
    icon: LucideIcon;
};

export const NAVIGATION_MAP: NavMapItem[] = [
    { title: 'Dashboard', path: ROUTES.DASHBOARD, keywords: ['home', 'overview', 'stats', 'analytics'], icon: LayoutDashboard },
    { title: 'Student Management', path: ROUTES.STUDENTS, keywords: ['pupils', 'records', 'registration', 'classes'], icon: Users },
    { title: 'Staff & Teachers', path: ROUTES.STAFF, keywords: ['employees', 'faculty', 'instructors', 'payroll'], icon: Briefcase },
    { title: 'Parent Portal', path: '/dashboard/parents', keywords: ['guardians', 'families', 'contact'], icon: User },
    { title: 'Attendance Marking', path: ROUTES.ATTENDANCE, keywords: ['daily', 'records', 'present', 'absent'], icon: CalendarDays },
    { title: 'Leave Requests', path: '/dashboard/attendance/leaves', keywords: ['permissions', 'absence', 'applications'], icon: ClipboardList },
    { title: 'Exams & Terms', path: ROUTES.EXAMS, keywords: ['tests', 'assessments', 'midterm', 'final'], icon: BookOpen },
    { title: 'Mark Sheets', path: ROUTES.MARKS, keywords: ['results', 'scores', 'grades', 'performance'], icon: ClipboardList },
    { title: 'Subjects & Periods', path: '/academics', keywords: ['courses', 'timetable', 'schedule', 'curriculum'], icon: BookOpen },
    { title: 'Notice Board (Teacher)', path: ROUTES.TEACHER_NOTICE_BOARD, keywords: ['announcements', 'broadcast', 'news'], icon: Megaphone },
    { title: 'Notice Board (Parent)', path: ROUTES.PARENT_NOTICE_BOARD, keywords: ['announcements', 'broadcast', 'news'], icon: Megaphone },
    { title: 'Master Schedule', path: '/timetable', keywords: ['timetable', 'calendar', 'planning'], icon: Calendar },
    { title: 'Fees Management', path: ROUTES.FEE, keywords: ['challans', 'billing', 'payments', 'accounts'], icon: WalletCards },
    { title: 'Fee Defaulters', path: ROUTES.DEFAULTERS, keywords: ['unpaid', 'arrears', 'due', 'warning'], icon: AlertTriangle },
    { title: 'Staff Payroll', path: ROUTES.PAYROLL, keywords: ['salaries', 'payments', 'slips', 'finance'], icon: Wallet },
    { title: 'Class Settings', path: ROUTES.SETTINGS_CLASSES, keywords: ['sections', 'configuration', 'setup'], icon: Settings },
    { title: 'Global Notices', path: ROUTES.NOTICE_BOARD, keywords: ['broadcast', 'admin', 'announcements'], icon: Megaphone },
    { title: 'Notification System', path: '/dashboard/settings/notifications', keywords: ['alerts', 'push', 'configuration'], icon: Bell },
];
