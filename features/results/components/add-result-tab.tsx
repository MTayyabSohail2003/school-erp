'use client';

import { useState, useEffect } from 'react';
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
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    Search,
    LayoutGrid,
    X,
    Info,
    ArrowRight,
    ArrowRightCircle,
    Calendar,
    School,
    BookOpen,
    Users,
    Plus,
    Printer,
    CheckCircle2,
    Sparkles
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

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

    // Reset page to 1 whenever filters or search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedYear, selectedClass, selectedTermName, searchQuery]);

    const totalResults = filteredStudents.length;
    const totalPages = Math.ceil(totalResults / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalResults);
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

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
                    <div className="relative group/filters">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover/filters:opacity-100 transition-opacity duration-1000" />

                        <div className="flex flex-col xl:flex-row p-8 items-stretch xl:items-end gap-6 bg-gradient-to-b from-primary/[0.03] to-transparent">
                            {/* Academic Year Filter */}
                            <div className="flex-1 space-y-3 relative">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                                            selectedYear ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                                        )}>
                                            {selectedYear ? <CheckCircle2 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                        </div>
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Academic Year</label>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 rounded-lg text-primary hover:bg-primary/10 transition-all hover:rotate-90 duration-300"
                                        onClick={() => setIsYearMgmtOpen(true)}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className={cn(
                                        "rounded-[1.25rem] border-border/50 bg-background h-16 px-5 focus:ring-primary/20 transition-all font-black text-sm shadow-sm hover:border-primary/30 w-full group/trigger",
                                        selectedYear && "border-emerald-500/30 bg-emerald-500/[0.02] shadow-emerald-500/5"
                                    )}>
                                        <SelectValue placeholder="Select Session" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl p-1">
                                        <SelectItem value="ALL" className="rounded-xl font-bold italic py-3">All Years Archive</SelectItem>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year} className="rounded-xl font-bold italic py-3">
                                                {year} Session
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* visual connector */}
                            <div className="hidden xl:flex items-center justify-center mb-5 opacity-20">
                                <ArrowRightCircle className="w-5 h-5 text-muted-foreground" />
                            </div>

                            {/* Result Term Filter */}
                            <div className="flex-1 space-y-3 relative">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            "h-7 w-7 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                                            selectedTermName ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                                        )}>
                                            {selectedTermName ? <CheckCircle2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                        </div>
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Result Term</label>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 rounded-lg text-primary hover:bg-primary/10 transition-all hover:rotate-90 duration-300"
                                        onClick={() => setIsTermMgmtOpen(true)}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <Select value={selectedTermName} onValueChange={setSelectedTermName}>
                                    <SelectTrigger className={cn(
                                        "rounded-[1.25rem] border-border/50 bg-background h-16 px-5 focus:ring-primary/20 transition-all font-black text-sm shadow-sm hover:border-primary/30 w-full",
                                        selectedTermName && "border-emerald-500/30 bg-emerald-500/[0.02] shadow-emerald-500/5",
                                        !selectedYear && "opacity-50 cursor-not-allowed"
                                    )}>
                                        <SelectValue placeholder="Select Evaluation" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl p-1">
                                        {termsLoading ? (
                                            <div className="flex items-center justify-center p-6">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                            </div>
                                        ) : !selectedYear ? (
                                            <div className="p-6 flex flex-col items-center text-center gap-2">
                                                <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-primary/30" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Select Year First</span>
                                            </div>
                                        ) : (
                                            globalTermNames?.map((name) => (
                                                <SelectItem key={name} value={name} className="rounded-xl font-bold italic py-3 uppercase">
                                                    {name} Examination
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* visual connector */}
                            <div className="hidden xl:flex items-center justify-center mb-5 opacity-20">
                                <ArrowRightCircle className="w-5 h-5 text-muted-foreground" />
                            </div>

                            {/* Academic Class Filter */}
                            <div className="flex-1 space-y-3 relative">
                                <div className="flex items-center gap-2.5 px-1 leading-none h-7">
                                    <div className={cn(
                                        "h-7 w-7 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                                        selectedClass ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                                    )}>
                                        {selectedClass ? <CheckCircle2 className="w-4 h-4" /> : <School className="w-4 h-4" />}
                                    </div>
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Academic Class</label>
                                </div>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className={cn(
                                        "rounded-[1.25rem] border-border/50 bg-background h-16 px-5 focus:ring-primary/20 transition-all font-black text-sm shadow-sm hover:border-primary/30 w-full",
                                        selectedClass && "border-emerald-500/30 bg-emerald-500/[0.02] shadow-emerald-500/5",
                                        !selectedTermName && "opacity-50"
                                    )}>
                                        <SelectValue placeholder="Select Grade" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl p-1">
                                        {classesLoading ? (
                                            <div className="flex items-center justify-center p-6">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            classes?.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id} className="rounded-xl font-bold italic py-3">
                                                    Grade {cls.name} {cls.section ? `• ${cls.section}` : ''}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Status Hub */}
                            <div className="flex-none flex flex-row xl:flex-col items-center xl:items-stretch justify-center gap-3 xl:w-[240px] pt-4 xl:pt-0">
                                <div className={cn(
                                    "flex-1 rounded-[1.25rem] border p-4 flex items-center gap-4 transition-all duration-700 relative overflow-hidden group/status",
                                    isFilterSelected
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-lg shadow-emerald-500/5"
                                        : "bg-primary/[0.03] border-primary/20 text-primary/80"
                                )}>
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner",
                                        isFilterSelected ? "bg-emerald-500 text-white rotate-[360deg]" : "bg-primary/10 text-primary"
                                    )}>
                                        {isFilterSelected ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Info className="w-6 h-6 animate-pulse" />}
                                    </div>
                                    <div className="flex flex-col flex-1 justify-center">
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1.5">
                                            {isFilterSelected ? 'Ready to Sync' : 'Selection Flux'}
                                        </p>
                                        <p className="text-[10px] font-bold opacity-60 leading-none">
                                            {isFilterSelected ? `${filteredStudents?.length} active records` : 'Awaiting parameters...'}
                                        </p>
                                    </div>
                                    {isFilterSelected && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500/50" />
                                    )}
                                </div>

                                {isFilterSelected && (
                                    <Button
                                        variant="ghost"
                                        onClick={clearFilters}
                                        className="rounded-xl h-10 px-4 gap-2.5 hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase italic tracking-widest text-[10px] text-muted-foreground/40 mt-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Clear Archive
                                    </Button>
                                )}
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
                                        paginatedStudents.map((student, idx) => (
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
                                                    {(startIndex + idx + 1).toString().padStart(2, '0')}
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

                    {/* Pagination Footer */}
                    {totalResults > 0 && (
                        <div className="px-6 py-4 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                    Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{endIndex}</span> of <span className="text-foreground">{totalResults}</span> students
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 text-muted-foreground transition-all"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 text-muted-foreground transition-all"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .map((p, idx, array) => {
                                            const showEllipsis = idx > 0 && p !== array[idx - 1] + 1;
                                            return (
                                                <div key={p} className="flex items-center gap-1">
                                                    {showEllipsis && <span className="text-muted-foreground/30 text-xs font-bold px-1">...</span>}
                                                    <Button
                                                        variant={currentPage === p ? 'default' : 'ghost'}
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 w-8 p-0 rounded-lg font-black text-xs transition-all duration-300",
                                                            currentPage === p ? "shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:bg-primary/5"
                                                        )}
                                                        onClick={() => setCurrentPage(p)}
                                                    >
                                                        {p}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 text-muted-foreground transition-all"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 text-muted-foreground transition-all"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
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
