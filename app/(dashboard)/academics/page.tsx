import { SubjectsSetup } from '@/features/subjects/components/subjects-setup';
import { PeriodsSetup } from '@/features/timetable/components/periods-setup';

export default function AcademicsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Academics Setup</h1>
                <p className="text-sm text-muted-foreground">Configure the foundational entities for the School ERP</p>
            </div>

            <div className="space-y-10">
                <SubjectsSetup />
                <PeriodsSetup />
            </div>
        </div>
    );
}
