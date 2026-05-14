'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useGetAllResultsByStudent, useArchiveStudents } from '../hooks/use-results';
import { calculateGradeAndPercentage } from '../schemas/results.schema';
import { cn } from '@/lib/utils';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
import {
    Search,
    Filter,
    User,
    Loader2,
    ChevronRight,
    Calendar,
    BookOpen,
    Award,
    TrendingUp,
    ArrowLeft,
    GraduationCap,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    School,
    FileText,
    Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentReportCardPrintDialog } from './student-report-card-print-dialog';

type StudentRecord = {
    id: string;
    full_name: string;
    roll_number: string;
    photo_url?: string;
    status: string;
    classes?: { name: string; section?: string };
};

type ResultRecord = {
    id: string;
    term_id: string;
    student_id: string;
    class_id?: string;
    subject_id: string;
    obtained_marks: number;
    total_marks: number;
    grade: string;
    percentage: number;
    subjects: { name: string; code?: string };
    classes?: { name: string; section?: string };
    exam_terms: { id: string; name: string; academic_year: string };
};

export function ViewResultsTab() {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [classFilter, setClassFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const { data: allStudents, isLoading: studentsLoading } = useArchiveStudents(classFilter, statusFilter);
    const { data: classes } = useClasses();

    const filteredStudents = useMemo(() => {
        return (allStudents ?? [])
            .filter((s: StudentRecord) => {
                const matchSearch = !searchQuery ||
                    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchSearch;
            })
            .sort((a: StudentRecord, b: StudentRecord) => a.full_name.localeCompare(b.full_name));
    }, [allStudents, searchQuery]);

    const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const selectedStudent = allStudents?.find((s: StudentRecord) => s.id === selectedStudentId) as StudentRecord | undefined;

    if (selectedStudentId && selectedStudent) {
        return (
            <StudentResultsArchive
                student={selectedStudent}
                onBack={() => setSelectedStudentId(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Student Lookup</CardTitle>
                            <CardDescription className="text-xs">Search across all students — active, promoted, or graduated</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or roll number..."
                                className="pl-10 h-12 rounded-xl border-border bg-background text-sm italic"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="h-12 w-48 rounded-xl font-bold text-xs uppercase tracking-widest">
                                <User className="w-3.5 h-3.5 mr-2 text-primary/60" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="ALL" className="font-bold">All Students</SelectItem>
                                <SelectItem value="ACTIVE" className="font-bold">Active</SelectItem>
                                <SelectItem value="GRADUATED" className="font-bold">Graduated</SelectItem>
                                <SelectItem value="LEAVER" className="font-bold">Left</SelectItem>
                                <SelectItem value="INACTIVE" className="font-bold">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="h-12 w-48 rounded-xl font-bold text-xs uppercase tracking-widest">
                                <School className="w-3.5 h-3.5 mr-2 text-primary/60" />
                                <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="ALL" className="font-bold">All Classes</SelectItem>
                                {classes?.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id} className="font-bold">
                                        Class {cls.name} {cls.section ? `• ${cls.section}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Students List */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">Academic Archive</CardTitle>
                                <CardDescription className="text-xs">Select a student to view their complete result history</CardDescription>
                            </div>
                        </div>
                        <Badge className="rounded-xl h-10 px-4 bg-primary/10 text-primary border border-primary/20 font-bold">
                            {filteredStudents.length} Students
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-16 font-bold text-xs uppercase tracking-tight py-5 px-6">S.N</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-tight">Student</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-tight text-center">Roll</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-tight text-center">Class</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-tight text-center">Status</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-tight px-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="wait">
                                {studentsLoading ? (
                                    <TableRow key="loading">
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading student archive...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : !filteredStudents.length ? (
                                    <TableRow key="empty">
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                                                <User className="h-10 w-10 opacity-20" />
                                                <p className="font-bold text-sm uppercase tracking-widest italic">No students found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedStudents.map((student: StudentRecord, idx: number) => (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15, delay: idx * 0.02 }}
                                            className="group hover:bg-muted/40 transition-colors border-b cursor-pointer"
                                            onClick={() => setSelectedStudentId(student.id)}
                                        >
                                            <TableCell className="py-4 pl-6 font-mono font-bold text-muted-foreground/50">
                                                {((currentPage - 1) * PAGE_SIZE + idx + 1).toString().padStart(2, '0')}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <ImagePreviewDialog src={student.photo_url} title={student.full_name} description={`Roll: ${student.roll_number}`}>
                                                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm ring-1 ring-border/50 group-hover:scale-110 transition-transform">
                                                            <AvatarImage src={student.photo_url} />
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">{student.full_name?.slice(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                    </ImagePreviewDialog>
                                                    <span className="font-bold text-sm">{student.full_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-mono text-xs rounded-lg">{student.roll_number || '—'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-xs font-bold uppercase">{student.classes?.name || '—'}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={cn(
                                                    "rounded-lg text-[10px] font-black uppercase tracking-widest border-none",
                                                    student.status === 'ACTIVE' && "bg-emerald-500/10 text-emerald-600",
                                                    student.status === 'GRADUATED' && "bg-indigo-500/10 text-indigo-600",
                                                    student.status === 'LEAVER' && "bg-orange-500/10 text-orange-600",
                                                    student.status === 'INACTIVE' && "bg-red-500/10 text-red-600",
                                                )}>
                                                    {student.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-xl h-9 px-4 font-bold uppercase text-[10px] tracking-widest gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                                >
                                                    View Archive
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                        </Table>
                    </div>

                    {filteredStudents.length > PAGE_SIZE && (
                        <div className="px-6 py-4 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                Showing <span className="text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="text-foreground">{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)}</span> of <span className="text-foreground">{filteredStudents.length}</span>
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <Badge variant="outline" className="rounded-lg px-3 font-mono text-xs">{currentPage} / {totalPages}</Badge>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Full student archive view — shows ALL results across ALL years and terms
function StudentResultsArchive({ student, onBack }: { student: StudentRecord; onBack: () => void }) {
    const { data: results, isLoading } = useGetAllResultsByStudent(student.id);
    const [yearFilter, setYearFilter] = useState<string>('ALL');
    const [termFilter, setTermFilter] = useState<string>('ALL');
    const [archiveClassFilter, setArchiveClassFilter] = useState<string>('ALL');

    // State for print dialog
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [selectedPrintData, setSelectedPrintData] = useState<{
        termResults: ResultRecord[];
        termName: string;
        academicYear: string;
        className: string;
    } | null>(null);

    const handlePrintClick = (termName: string, year: string, className: string, termResults: ResultRecord[]) => {
        setSelectedPrintData({
            termResults,
            termName,
            academicYear: year,
            className
        });
        setPrintDialogOpen(true);
    };

    // Group results by academic_year → class_name → term_name
    const grouped = useMemo(() => {
        if (!results) return {};

        const map: Record<string, Record<string, Record<string, ResultRecord[]>>> = {};
        (results as ResultRecord[]).forEach(r => {
            const year = r.exam_terms.academic_year;
            const term = r.exam_terms.name;
            const classContext = r.classes?.name || 'Unknown';

            // Dynamic Filtering
            if (yearFilter !== 'ALL' && year !== yearFilter) return;
            if (termFilter !== 'ALL' && term !== termFilter) return;
            if (archiveClassFilter !== 'ALL' && r.class_id !== archiveClassFilter) return;

            if (!map[year]) map[year] = {};
            if (!map[year][classContext]) map[year][classContext] = {};
            if (!map[year][classContext][term]) map[year][classContext][term] = [];
            map[year][classContext][term].push(r);
        });

        return map;
    }, [results, yearFilter, termFilter, archiveClassFilter]);

    const availableYears = useMemo(() => {
        if (!results) return [];
        return Array.from(new Set((results as ResultRecord[]).map(r => r.exam_terms.academic_year))).sort().reverse();
    }, [results]);

    const availableClasses = useMemo(() => {
        if (!results) return [];
        let rList = (results as ResultRecord[]);
        if (yearFilter !== 'ALL') rList = rList.filter(r => r.exam_terms.academic_year === yearFilter);
        
        const ids = new Set();
        const list: { id: string, name: string }[] = [];
        rList.forEach(r => {
            if (r.classes && !ids.has(r.class_id)) {
                ids.add(r.class_id);
                list.push({ id: r.class_id!, name: r.classes.name });
            }
        });
        return list.sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [results, yearFilter]);

    const availableTerms = useMemo(() => {
        if (!results) return [];
        let rList = (results as ResultRecord[]);
        if (yearFilter !== 'ALL') rList = rList.filter(r => r.exam_terms.academic_year === yearFilter);
        if (archiveClassFilter !== 'ALL') rList = rList.filter(r => r.class_id === archiveClassFilter);
        return Array.from(new Set(rList.map(r => r.exam_terms.name))).sort();
    }, [results, yearFilter, archiveClassFilter]);

    const years = Object.keys(grouped).sort().reverse();

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="ghost"
                                className="rounded-xl h-12 px-5 font-bold uppercase tracking-widest text-[10px] gap-2"
                                onClick={onBack}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            <div className="h-12 w-px bg-border/40" />
                            <ImagePreviewDialog src={student.photo_url} title={student.full_name} description={`Roll: ${student.roll_number}`}>
                                <Avatar className="h-16 w-16 border-4 border-primary/20 shadow-xl hover:scale-105 transition-transform cursor-pointer">
                                    <AvatarImage src={student.photo_url} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">{student.full_name?.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                            </ImagePreviewDialog>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">{student.full_name}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <Badge variant="secondary" className="rounded-lg font-mono text-xs">{student.roll_number}</Badge>
                                    <Badge className={cn(
                                        "rounded-lg text-[10px] font-black uppercase tracking-widest border-none",
                                        student.status === 'ACTIVE' && "bg-emerald-500/10 text-emerald-600",
                                        student.status === 'GRADUATED' && "bg-indigo-500/10 text-indigo-600",
                                        student.status === 'LEAVER' && "bg-orange-500/10 text-orange-600",
                                    )}>
                                        {student.status}
                                    </Badge>
                                    {student.classes && (
                                        <Badge variant="outline" className="rounded-lg text-[10px] font-bold">
                                            Class {student.classes.name}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Total Records</p>
                                <p className="text-3xl font-black italic tracking-tighter text-primary">{results?.length ?? 0}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Sessions</p>
                                <p className="text-3xl font-black italic tracking-tighter text-indigo-600">{years.length}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Filter Bar */}
            {!isLoading && results && results.length > 0 && (
                <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-2 px-3 text-muted-foreground shrink-0 border-r pr-5">
                       <Filter className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Filter Archive</span>
                    </div>

                    <div className="flex flex-1 gap-4 w-full">
                        <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setTermFilter('ALL'); setArchiveClassFilter('ALL'); }}>
                            <SelectTrigger className="h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-muted/20 border-none px-4">
                                <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                                <SelectValue placeholder="Academic Year" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-xl">
                                <SelectItem value="ALL" className="font-bold">All Academic Years</SelectItem>
                                {availableYears.map(y => (
                                    <SelectItem key={y} value={y} className="font-bold">{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={archiveClassFilter} onValueChange={(v) => { setArchiveClassFilter(v); setTermFilter('ALL'); }}>
                            <SelectTrigger className="h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-muted/20 border-none px-4">
                                <School className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                                <SelectValue placeholder="Grade Context" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-xl">
                                <SelectItem value="ALL" className="font-bold">All Recorded Classes</SelectItem>
                                {availableClasses.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="font-bold">Grade {c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={termFilter} onValueChange={setTermFilter}>
                            <SelectTrigger className="h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-muted/20 border-none px-4">
                                <BookOpen className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                                <SelectValue placeholder="Exam Term" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-xl">
                                <SelectItem value="ALL" className="font-bold">All Result Terms</SelectItem>
                                {availableTerms.map(t => (
                                    <SelectItem key={t} value={t} className="font-bold uppercase italic">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(yearFilter !== 'ALL' || termFilter !== 'ALL' || archiveClassFilter !== 'ALL') && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl h-11 px-4 font-bold text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10"
                            onClick={() => { setYearFilter('ALL'); setTermFilter('ALL'); setArchiveClassFilter('ALL'); }}
                        >
                            <TrendingUp className="w-3.5 h-3.5 mr-2" />
                            Clear Filters
                        </Button>
                    )}
                </div>
            )}

            {/* Results Timeline */}
            {isLoading ? (
                <Card className="rounded-xl border">
                    <CardContent className="h-64 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading academic timeline...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : !years.length ? (
                <Card className="rounded-xl border border-dashed">
                    <CardContent className="h-48 flex items-center justify-center flex-col gap-3 text-muted-foreground/40">
                        <GraduationCap className="h-10 w-10 opacity-20" />
                        <p className="font-bold text-sm uppercase tracking-widest italic">No results recorded for this student</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {years.map((year) => (
                        <div key={year} className="space-y-6">
                            {Object.entries(grouped[year]).map(([className, classTerms]) => (
                                <Card key={`${year}-${className}`} className="rounded-xl border shadow-sm overflow-hidden">
                                    <CardHeader className="bg-muted/10 border-b px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Session {year}
                                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-primary/20 bg-primary/5 text-primary">
                                                        Grade {className}
                                                    </Badge>
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        {Object.entries(classTerms).map(([termName, termResults]) => {
                                            const totalObtained = termResults.reduce((s, r) => s + r.obtained_marks, 0);
                                            const totalMax = termResults.reduce((s, r) => s + r.total_marks, 0);
                                            const { percentage: overallPct, grade: overallGrade } = calculateGradeAndPercentage(totalObtained, totalMax);
                                            const isPassed = overallPct >= 40;

                                            return (
                                                <div key={termName} className="rounded-2xl border overflow-hidden shadow-sm">
                                                    {/* Term Header */}
                                                    <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-b">
                                                        <div className="flex flex-col">
                                                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-indigo-700">
                                                                {termName} Examination
                                                            </CardTitle>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/40" />
                                                                <span className="text-xs font-bold text-muted-foreground">{totalObtained}/{totalMax}</span>
                                                            </div>
                                                            <Badge className={cn(
                                                                "rounded-lg text-[10px] font-black uppercase tracking-widest border-none",
                                                                isPassed ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                                            )}>
                                                                {overallPct.toFixed(1)}% • Grade {overallGrade}
                                                            </Badge>
                                                            <Badge className={cn(
                                                                "rounded-lg text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                                                                isPassed ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                                            )}>
                                                                {isPassed ? 'PASS' : 'FAIL'}
                                                            </Badge>

                                                            {/* Print Button */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-xl h-9 px-4 font-black uppercase text-[10px] tracking-widest gap-2 bg-background shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
                                                                onClick={() => handlePrintClick(termName, year, className, termResults)}
                                                            >
                                                                <Printer className="w-3.5 h-3.5" />
                                                                Print Card
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Subjects Table */}
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader className="bg-muted/10">
                                                                <TableRow className="hover:bg-transparent">
                                                                    <TableHead className="w-12 font-bold text-[10px] uppercase tracking-widest py-3 px-6">#</TableHead>
                                                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Subject</TableHead>
                                                                    <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Obtained</TableHead>
                                                                    <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Total</TableHead>
                                                                    <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">%</TableHead>
                                                                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest px-6">Grade</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {termResults.map((r, i) => (
                                                                    <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                                                                        <TableCell className="py-3 px-6 font-mono text-xs text-muted-foreground/50">{i + 1}</TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-bold text-sm uppercase tracking-tight">{r.subjects.name}</span>
                                                                                {r.subjects.code && <span className="text-[9px] font-mono text-muted-foreground/40 uppercase">{r.subjects.code}</span>}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-center font-black text-sm">{r.obtained_marks}</TableCell>
                                                                        <TableCell className="text-center font-bold text-sm text-muted-foreground/60">{r.total_marks}</TableCell>
                                                                        <TableCell className="text-center font-bold text-sm">{r.percentage.toFixed(1)}%</TableCell>
                                                                        <TableCell className="text-right px-6">
                                                                            <Badge className={cn(
                                                                                "rounded-lg text-[10px] font-black border-none shadow-sm",
                                                                                r.percentage >= 85 && "bg-emerald-500 text-white",
                                                                                r.percentage >= 70 && r.percentage < 85 && "bg-blue-500 text-white",
                                                                                r.percentage >= 40 && r.percentage < 70 && "bg-orange-500 text-white",
                                                                                r.percentage < 40 && "bg-red-500 text-white",
                                                                            )}>
                                                                                {r.grade}
                                                                            </Badge>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Student Report Card Print Dialog */}
            {selectedPrintData && (
                <StudentReportCardPrintDialog
                    open={printDialogOpen}
                    onOpenChange={setPrintDialogOpen}
                    student={student}
                    results={selectedPrintData.termResults}
                    termName={selectedPrintData.termName}
                    academicYear={selectedPrintData.academicYear}
                    className={selectedPrintData.className}
                />
            )}
        </div>
    );
}
