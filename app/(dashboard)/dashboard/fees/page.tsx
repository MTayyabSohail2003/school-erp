import { FeeDashboard } from '@/features/fees/components/fee-dashboard';

export default function FeesPage() {
    return (
        <div className="flex-1 w-full flex flex-col p-6 animate-in fade-in duration-500 pb-20 md:pb-6">
            <FeeDashboard />
        </div>
    );
}
