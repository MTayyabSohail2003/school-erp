'use client';

import { 
    Info, 
    CheckCircle, 
    AlertTriangle, 
    AlertCircle, 
    Bell, 
    GraduationCap, 
    Wallet, 
    Users,
    Calendar,
    FileText,
    BadgeCheck
} from 'lucide-react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

interface TemplateDef {
    id: string;
    category: 'Academics' | 'Attendance' | 'Finance' | 'Registration' | 'General';
    name: string;
    description: string;
    roles: ('Admin' | 'Teacher' | 'Parent')[];
    type: NotificationType;
}

const TEMPLATE_DEFS: TemplateDef[] = [
    // Academics
    {
        id: 'exam-scheduled',
        category: 'Academics',
        name: 'New Exam Scheduled',
        description: 'Sent when a new exam or date sheet is published.',
        roles: ['Parent'],
        type: 'INFO',
    },
    {
        id: 'report-card-published',
        category: 'Academics',
        name: 'Report Card Published',
        description: 'Sent when result marks are finalized and report cards are ready.',
        roles: ['Parent'],
        type: 'SUCCESS',
    },
    {
        id: 'class-assigned',
        category: 'Academics',
        name: 'New Class Assigned',
        description: 'Sent to teachers when they are assigned to a new class or period.',
        roles: ['Teacher'],
        type: 'SUCCESS',
    },
    // Attendance
    {
        id: 'leave-submitted',
        category: 'Attendance',
        name: 'Leave Request Submitted',
        description: 'Sent to admins whenever a parent applies for leave.',
        roles: ['Admin'],
        type: 'INFO',
    },
    {
        id: 'leave-approved',
        category: 'Attendance',
        name: 'Leave Request Approved',
        description: 'Sent to parents when their child\'s leave is approved.',
        roles: ['Parent'],
        type: 'SUCCESS',
    },
    {
        id: 'student-absent',
        category: 'Attendance',
        name: 'Student Marked Absent',
        description: 'Sent to parents immediately if their child is marked absent.',
        roles: ['Parent'],
        type: 'WARNING',
    },
    // Finance
    {
        id: 'fee-challan',
        category: 'Finance',
        name: 'Fee Challan Generated',
        description: 'Bulk notification when monthly fee slips are ready.',
        roles: ['Parent'],
        type: 'INFO',
    },
    {
        id: 'fee-received',
        category: 'Finance',
        name: 'Fee Payment Received',
        description: 'Confirmation sent to parents after successful payment.',
        roles: ['Parent'],
        type: 'SUCCESS',
    },
    {
        id: 'salary-disbursed',
        category: 'Finance',
        name: 'Salary Disbursed',
        description: 'Sent to staff when their monthly payroll is processed.',
        roles: ['Teacher'],
        type: 'SUCCESS',
    },
    // Registration
    {
        id: 'new-staff',
        category: 'Registration',
        name: 'New Staff Registered',
        description: 'Admin alert when a new teacher account is created.',
        roles: ['Admin'],
        type: 'SUCCESS',
    },
    {
        id: 'new-student',
        category: 'Registration',
        name: 'New Student Registered',
        description: 'Admin alert when a new student is added to the system.',
        roles: ['Admin'],
        type: 'SUCCESS',
    },
    // General
    {
        id: 'announcement',
        category: 'General',
        name: 'New Announcement',
        description: 'Broadcast notices sent to all applicable users.',
        roles: ['Admin', 'Teacher', 'Parent'],
        type: 'INFO',
    },
];

const TYPE_CONFIG = {
    INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    SUCCESS: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    ERROR: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const CATEGORY_ICON = {
    Academics: GraduationCap,
    Attendance: Calendar,
    Finance: Wallet,
    Registration: Users,
    General: Bell,
};

export function NotificationTemplateList() {
    return (
        <div className="space-y-6">
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <BadgeCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Notification Registry</CardTitle>
                            <CardDescription>
                                Overview of all system-triggered notifications and their recipients.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border bg-background/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[200px]">Category & Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[150px]">Recipients</TableHead>
                                    <TableHead className="w-[120px]">Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {TEMPLATE_DEFS.map((template) => {
                                    const CategoryIcon = CATEGORY_ICON[template.category];
                                    const typeInfo = TYPE_CONFIG[template.type];
                                    const TypeIcon = typeInfo.icon;

                                    return (
                                        <TableRow key={template.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                                        <CategoryIcon className="w-3 h-3" />
                                                        {template.category}
                                                    </div>
                                                    <div className="text-sm">{template.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground leading-relaxed">
                                                {template.description}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {template.roles.map((role) => (
                                                        <Badge 
                                                            key={role} 
                                                            variant="secondary" 
                                                            className="text-[10px] h-5 px-1.5 font-medium"
                                                        >
                                                            {role}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    className={`gap-1.5 text-[10px] font-bold ${typeInfo.bg} ${typeInfo.color} border-none shadow-none`}
                                                >
                                                    <TypeIcon className="w-3 h-3" />
                                                    {template.type}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-dashed">
                    <CardHeader className="pb-3 text-center">
                        <div className="mx-auto p-2 rounded-full bg-blue-500/10 w-fit mb-2">
                            <Bell className="w-5 h-5 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg">Real-time Delivery</CardTitle>
                        <CardDescription>
                            All notifications are pushed instantly via Supabase Realtime to active user sessions.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="border-dashed">
                    <CardHeader className="pb-3 text-center">
                        <div className="mx-auto p-2 rounded-full bg-green-500/10 w-fit mb-2">
                            <Info className="w-5 h-5 text-green-500" />
                        </div>
                        <CardTitle className="text-lg">Smart Toasts</CardTitle>
                        <CardDescription>
                            Users receive non-intrusive toast alerts that allow them to jump directly to the relevant page.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="border-dashed">
                    <CardHeader className="pb-3 text-center">
                        <div className="mx-auto p-2 rounded-full bg-amber-500/10 w-fit mb-2">
                            <FileText className="w-5 h-5 text-amber-500" />
                        </div>
                        <CardTitle className="text-lg">Unread Tracking</CardTitle>
                        <CardDescription>
                            The notification bell tracks unread counts and persists them until acknowledged by the user.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
