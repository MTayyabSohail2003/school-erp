'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useGetTerms, useGetStudentsByClass, useGetClassResults, useTermInstance } from '../hooks/use-results';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import { 
    Filter, 
    User, 
    ChevronRight, 
    Loader2, 
    Search, 
    LayoutGrid, 
    X, 
    Info,
    ArrowRight,
    Calendar,
    School,
    BookOpen,
    Users,
    Plus,
    Printer
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StudentResultsDialog } from './student-results-dialog';
import { BulkResultsDialog } from './bulk-results-dialog';
import { TermManagementDialog } from './term-management-dialog';
import { YearManagementDialog } from './year-management-dialog';
import { ClassResultsPrintDialog } from './class-results-print-dialog';
import { motion, AnimatePresence } from 'framer-motion';

export function AddResultTab() {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedTermName, setSelectedTermName] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isTermMgmtOpen, setIsTermMgmtOpen] = useState(false);
    const [isYearMgmtOpen, setIsYearMgmtOpen] = useState(false);
    const [isPrintClassOpen, setIsPrintClassOpen] = useState(false);

    const { data: classes, isLoading: classesLoading } = useClasses();
    const { data: terms, isLoading: termsLoading } = useGetTerms();
    
    // Resolve the specific Term ID for the current (Year, Name) combination
    const { data: termInstance, isLoading: instanceLoading } = useTermInstance(selectedTermName, selectedYear);
    const selectedTermId = termInstance?.id;

    const { data: students, isLoading: studentsLoading } = useGetStudentsByClass(selectedClass);
    const { data: classResults, isLoading: classResultsLoading } = useGetClassResults(selectedTermId || '', selectedClass);

    // 1. UNIQUE YEARS: Derived from all existing terms
    const years = Array.from(new Set(terms?.map(t => t.academic_year) ?? [])).sort().reverse();
    
    // 2. GLOBAL TERM NAMES: Unique names across all years
    const globalTermNames = Array.from(new Set(terms?.map(t => t.name) ?? [])).sort();

    const filteredStudents = (students ?? [])
        .filter(s =>
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (!a.roll_number) return 1;
            if (!b.roll_number) return -1;
            return a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true, sensitivity: 'base' });
        });
    const isFilterSelected = !!selectedClass && !!selectedTermName && !!selectedYear;

    const clearFilters = () => {
        setSelectedYear('');
        setSelectedClass('');
        setSelectedTermName('');
        setSearchQuery('');
    };

    return (
        <div className="space-y-6">
            {/* 1. Selection Filters Card (Top) */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Selection Filters</CardTitle>
                            <CardDescription className="text-xs">Select options to filter student list</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row p-6 items-end gap-5 bg-primary/[0.02]">
                        <div className="w-full lg:flex-1 space-y-2.5">
                             <div className="flex items-center justify-between ml-1 leading-none">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-primary/40" />
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Academic Year</label>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 w-5 p-0 rounded-md text-primary hover:bg-primary/10 transition-colors"
                                    onClick={() => setIsYearMgmtOpen(true)}
                                >
                                    <Plus className="w-3 h-3" />
                                </Button>
                             </div>
                             <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="rounded-2xl border-border/50 bg-background h-14 focus:ring-primary/20 transition-all font-black text-sm shadow-sm hover:border-primary/30 w-full">
                                    <SelectValue placeholder="All Years" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                    <SelectItem value="ALL" className="rounded-xl font-bold italic">All Years</SelectItem>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year} className="rounded-xl font-bold italic">
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>

                        <div className="w-full lg:flex-1 space-y-2.5">
                             <div className="flex items-center justify-between ml-1 leading-none">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-3 h-3 text-primary/40" />
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Result Term</label>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 w-5 p-0 rounded-md text-primary hover:bg-primary/10 transition-colors"
                                    onClick={() => setIsTermMgmtOpen(true)}
                                >
                                    <Plus className="w-3 h-3" />
                                </Button>
                             </div>
                              <Select value={selectedTermName} onValueChange={setSelectedTermName}>
                                <SelectTrigger className="rounded-2xl border-border/50 bg-background h-14 focus:ring-primary/20 transition-all font-black text-sm shadow-sm hover:border-primary/30 w-full">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                    {termsLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        </div>
                                    ) : !selectedYear ? (
                                        <div className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                                            Select Year First
                                        </div>
                                    ) : (
                                        globalTermNames?.map((name) => (
                                            <SelectItem key={name} value={name} className="rounded-xl font-bold italic">
                                                {name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                              </Select>
                        </div>

                        <div className="w-full lg:flex-1 space-y-2.5">
                             <div className="flex items-center gap-2 ml-1">
                                <School className="w-3 h-3 text-primary/40" />
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Academic Class</label>
                             </div>
                             <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="rounded-2xl border-border/50 bg-background h-14 focus:ring-primary/20 transition-all font-black text-sm shadow-sm hover:border-primary/30 w-full">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                    {classesLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        classes?.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id} className="rounded-xl font-bold italic">
                                                {cls.name} {cls.section ? `(${cls.section})` : ''}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                             </Select>
                        </div>

                        <div className="flex-none flex items-center gap-3">
                            {isFilterSelected && (
                                <Button 
                                    variant="outline" 
                                    onClick={clearFilters}
                                    className="rounded-2xl border-dashed h-14 px-6 gap-3 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all font-black uppercase italic tracking-widest text-[10px] border-border/50 shadow-sm"
                                >
                                    <X className="w-4 h-4 shrink-0" />
                                    <span>Reset Filters</span>
                                </Button>
                            )}
                            <div className={cn(
                                "rounded-2xl border px-6 h-14 flex items-center gap-3 transition-all duration-500 min-w-[180px]",
                                isFilterSelected 
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" 
                                    : "bg-primary/5 border-primary/20 text-primary"
                            )}>
                                {isFilterSelected ? <Users className="w-4 h-4 animate-bounce" /> : <Info className="w-4 h-4 animate-pulse" />}
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                                        {isFilterSelected ? 'Results Ready' : 'Discovery Mode'}
                                    </p>
                                    <p className="text-[9px] font-bold opacity-60 leading-none mt-1">
                                        {isFilterSelected ? `${filteredStudents?.length} Students found` : 'Complete selection'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Students List Table Card (Bottom) */}
            <Card className="rounded-xl border shadow-sm overflow-hidden min-h-[400px]">
                <CardHeader className="bg-muted/10 border-b px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold">Candidates List</CardTitle>
                            <CardDescription className="text-xs">Manage student evaluations and results</CardDescription>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <div className="relative group w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name or roll..."
                                    className="pl-10 h-11 rounded-xl border-border bg-background focus:ring-primary/20 transition-all text-sm italic"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    className={cn(
                                        "rounded-xl h-11 px-5 font-bold text-sm gap-2 transition-all shadow-sm",
                                        (!selectedClass || !selectedTermName || !selectedYear) 
                                            ? "opacity-50 grayscale cursor-not-allowed" 
                                            : "bg-primary text-primary-foreground hover:shadow-md active:scale-95"
                                    )}
                                    disabled={!selectedClass || !selectedTermName || !selectedYear}
                                    onClick={() => setIsBulkOpen(true)}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Bulk Marks
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "rounded-xl h-11 px-5 font-bold text-sm gap-2 transition-all shadow-sm border-border/60 hover:text-primary",
                                        (!selectedClass || !selectedTermName || !selectedYear) 
                                            ? "opacity-50 grayscale cursor-not-allowed" 
                                            : "hover:shadow-md active:scale-95"
                                    )}
                                    disabled={!selectedClass || !selectedTermName || !selectedYear}
                                    onClick={() => setIsPrintClassOpen(true)}
                                >
                                    <Printer className="w-4 h-4" />
                                    Print List
                                </Button>
                                <Badge className="rounded-xl h-11 px-4 bg-primary/10 text-primary border border-primary/20 font-bold flex items-center gap-2">
                                    {filteredStudents.length} Students
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-b-border">
                                    <TableHead className="w-16 font-bold text-xs uppercase tracking-tight py-5 px-6">S.N</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-tight py-5">Student Information</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-tight text-center">Roll ID</TableHead>
                                    <TableHead className="text-right font-bold text-xs uppercase tracking-tight px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="wait">
                                    {!selectedClass ? (
                                        <TableRow key="no-class">
                                            <TableCell colSpan={4} className="h-80 text-center">
                                                <div className="flex flex-col items-center gap-4 text-muted-foreground/60 max-w-xs mx-auto">
                                                    <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-2">
                                                        <User className="h-10 w-10 opacity-30" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-base uppercase tracking-tight italic">Selection Required</p>
                                                        <p className="text-xs font-medium">Please select an academic class and term above to populate the student list.</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : studentsLoading ? (
                                        <TableRow key="loading">
                                            <TableCell colSpan={4} className="h-80 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Fetching records...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredStudents.length === 0 ? (
                                        <TableRow key="no-results">
                                            <TableCell colSpan={4} className="h-80 text-center">
                                                <div className="flex flex-col items-center gap-4 text-muted-foreground/60 max-w-xs mx-auto">
                                                    <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-2">
                                                        <Search className="h-10 w-10 opacity-30" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-base uppercase tracking-tight italic">No Results</p>
                                                        <p className="text-xs font-medium">No students found matching your criteria in this class.</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStudents.map((student, idx) => (
                                            <motion.tr
                                                layout
                                                key={student.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="group hover:bg-muted/40 transition-colors border-b-border/50"
                                            >
                                                <TableCell className="py-4 pl-6 font-mono font-bold text-muted-foreground/60">
                                                    {(idx + 1).toString().padStart(2, '0')}
                                                </TableCell>
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-4">
                                                        <ImagePreviewDialog
                                                            src={student.photo_url}
                                                            title={student.full_name}
                                                            description={`Roll Number: ${student.roll_number}`}
                                                        >
                                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-border/50 hover:scale-110 transition-transform">
                                                                <AvatarImage src={student.photo_url} alt={student.full_name} />
                                                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase italic">
                                                                    {student.full_name.slice(0, 2)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </ImagePreviewDialog>
                                                        <div>
                                                            <p className="font-bold text-sm tracking-tight">{student.full_name}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mt-1 flex items-center gap-1.5">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" /> Active Student
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary" className="font-mono text-sm px-3 rounded-lg border-muted-foreground/10 bg-muted/50">
                                                        {student.roll_number || '---'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {(instanceLoading || classResultsLoading) ? (
                                                            <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-xl" />
                                                        ) : (
                                                            <>
                                                                {classResults?.some(r => r.student_id === student.id) && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="rounded-xl h-10 px-4 font-bold uppercase italic tracking-widest text-[10px] gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                                                                        onClick={() => setSelectedStudent({ ...student, viewOnly: true })}
                                                                    >
                                                                        View Result
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className={cn(
                                                                        "rounded-xl h-10 px-5 font-bold uppercase italic tracking-widest text-[10px] gap-2 transition-all hover:bg-primary hover:text-primary-foreground",
                                                                        (!selectedTermName || !selectedYear) && "opacity-50 cursor-not-allowed grayscale"
                                                                    )}
                                                                    disabled={!selectedTermName || !selectedYear || instanceLoading}
                                                                    onClick={() => setSelectedStudent({ ...student, viewOnly: false })}
                                                                >
                                                                    {classResults?.some(r => r.student_id === student.id) ? 'Edit Marks' : 'Manage Result'}
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            {selectedStudent && (
                <StudentResultsDialog
                    open={!!selectedStudent}
                    onOpenChange={(open) => !open && setSelectedStudent(null)}
                    student={selectedStudent}
                    termId={selectedTermId || ''}
                    classId={selectedClass}
                    isReadOnly={selectedStudent.viewOnly}
                />
            )}

            {isBulkOpen && (
                <BulkResultsDialog
                    open={isBulkOpen}
                    onOpenChange={setIsBulkOpen}
                    termId={selectedTermId || ''}
                    classId={selectedClass}
                />
            )}

            <TermManagementDialog
                open={isTermMgmtOpen}
                onOpenChange={setIsTermMgmtOpen}
            />

            <YearManagementDialog
                open={isYearMgmtOpen}
                onOpenChange={setIsYearMgmtOpen}
            />

            <ClassResultsPrintDialog
                open={isPrintClassOpen}
                onOpenChange={setIsPrintClassOpen}
                students={filteredStudents}
                results={classResults}
                isLoading={classResultsLoading}
                termName={selectedTermName}
                classNameStr={classes?.find(c => c.id === selectedClass)?.name || null}
            />
        </div>
    );
}
