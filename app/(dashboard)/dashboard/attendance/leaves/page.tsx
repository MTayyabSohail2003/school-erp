import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveRequestForm } from '@/features/attendance/components/leave-request-form';
import { LeaveRequestsTable } from '@/features/attendance/components/leave-requests-table';

export default async function LeaveRequestsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // ignore
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get basic user profile strictly for role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'PARENT';
    const isParent = role === 'PARENT';

    // If Parent, fetch their linked students to populate the form
    let parentStudents: { id: string; full_name: string; roll_number: string; class?: { name: string; section: string; } }[] = [];
    if (isParent) {
        const { data } = await supabase
            .from('students')
            .select(`
                id, 
                full_name, 
                roll_number,
                class:classes(name, section)
            `)
            .eq('parent_id', user.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parentStudents = (data || []).map((s: any) => ({
            id: s.id,
            full_name: s.full_name,
            roll_number: s.roll_number,
            class: Array.isArray(s.class) ? s.class[0] : (s.class || undefined)
        }));
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
                        <p className="text-sm text-muted-foreground">
                            {isParent ? "Apply for leave for your children" : "Manage student leave requests"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
                {isParent && (
                    <div className="lg:col-span-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Apply for Leave</CardTitle>
                                <CardDescription>Submit a new leave request for your child.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {parentStudents.length > 0 ? (
                                    <LeaveRequestForm students={parentStudents} />
                                ) : (
                                    <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg text-center">
                                        No children found linked to your account.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className={isParent ? "lg:col-span-8" : "col-span-12"}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave History</CardTitle>
                            <CardDescription>
                                {isParent ? "Your past and current leave applications." : "All recent student leave requests."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LeaveRequestsTable userRole={role} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
