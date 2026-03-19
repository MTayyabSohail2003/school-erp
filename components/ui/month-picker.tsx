import * as React from 'react';
import { format, addMonths, subMonths, setMonth } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MonthPickerProps {
    value: string; // 'yyyy-MM'
    onChange: (value: string) => void;
    className?: string;
}

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
    const [open, setOpen] = React.useState(false);
    
    // Default to current date if value is empty/invalid
    const parsedDate = value ? new Date(`${value}-01T00:00:00`) : new Date();
    const [yearDate, setYearDate] = React.useState(parsedDate);

    // Sync internal year view with value prop when opened
    React.useEffect(() => {
        if (open) {
            setYearDate(value ? new Date(`${value}-01T00:00:00`) : new Date());
        }
    }, [open, value]);

    const yearString = format(yearDate, 'yyyy');

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = setMonth(yearDate, monthIndex);
        onChange(format(newDate, 'yyyy-MM'));
        setOpen(false);
    };

    const previousYear = () => setYearDate((prev) => subMonths(prev, 12));
    const nextYear = () => setYearDate((prev) => addMonths(prev, 12));

    const handleCurrentMonth = () => {
        onChange(format(new Date(), 'yyyy-MM'));
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-[200px] justify-between text-left font-normal px-3",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                        {value ? format(parsedDate, 'MMMM yyyy') : <span>Pick a month</span>}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
                <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 p-0 opacity-50 hover:opacity-100" onClick={previousYear}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">{yearString}</div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 p-0 opacity-50 hover:opacity-100" onClick={nextYear}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {MONTHS.map((month, index) => {
                        const isSelected = value && format(parsedDate, 'yyyy') === yearString && format(parsedDate, 'MM') === String(index + 1).padStart(2, '0');
                        return (
                            <Button
                                key={month}
                                variant={isSelected ? "default" : "ghost"}
                                className={cn("h-9 font-medium text-xs", isSelected ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white" : "")}
                                onClick={() => handleMonthSelect(index)}
                            >
                                {month}
                            </Button>
                        );
                    })}
                </div>
                <div className="mt-4 flex justify-between gap-2 border-t pt-2 border-muted/50">
                    <Button size="sm" variant="ghost" className="h-7 text-xs w-full text-emerald-600 hover:text-emerald-700" onClick={handleCurrentMonth}>
                        Current Month
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
