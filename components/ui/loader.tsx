import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
    size?: 'sm' | 'default' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export function Loader({ size = 'default', text, fullScreen = false, className }: LoaderProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        default: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const content = (
        <div className={cn('flex flex-col items-center justify-center gap-3 text-muted-foreground', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
            {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return (
        <div className="flex w-full items-center justify-center p-8">
            {content}
        </div>
    );
}
