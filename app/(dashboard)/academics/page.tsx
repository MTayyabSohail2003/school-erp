import { SubjectsSetup } from '@/features/subjects/components/subjects-setup';

export default function SubjectsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Academics Setup</h1>
                <p className="text-sm text-muted-foreground">Configure the foundational entities like Subjects for the Timetable engine</p>
            </div>

            <SubjectsSetup />
        </div>
    );
}
