'use client';

import { useParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Printer, ChevronLeft, GraduationCap, Star, ShieldCheck } from 'lucide-react';
import { useGraduationCertificate } from '../api/use-graduation-certificate';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SCHOOL_NAME, SCHOOL_TAGLINE, SCHOOL_ADDRESS } from '@/constants/school-identity';

export function GraduationCertificate() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.studentId as string;
    const [mounted, setMounted] = useState(false);

    const { data, isLoading, isError } = useGraduationCertificate(studentId);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 p-8 bg-slate-50 min-h-screen">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-40 rounded-lg" />
                </div>
                <Skeleton className="h-[700px] w-full rounded-3xl shadow-xl" />
            </div>
        );
    }

    if (isError || !data || !data.student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-6 text-foreground bg-slate-50">
                <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-12 w-12 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Record Not Found</h2>
                    <p className="text-muted-foreground max-w-sm">
                        The requested graduation record could not be located in our secure database.
                    </p>
                </div>
                <Button variant="outline" size="lg" onClick={() => router.back()} className="rounded-full px-8">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    if (!mounted) return null;

    const { student } = data;

    const handlePrint = () => {
        window.print();
    };

    const content = (
        <div className="fixed inset-0 z-[9999] bg-[#0f172a] overflow-auto flex flex-col items-center py-10 px-4 print:p-0 print:bg-white print:block print:static print:inset-auto print:z-0">

            {/* ── Control Bar (Screen Only) ── */}
            <div className="w-full max-w-6xl flex items-center justify-between mb-8 print:hidden print:!hidden">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                >
                    <ChevronLeft className="mr-2 h-5 w-5" /> Return to Dashboard
                </Button>

                <div className="flex gap-4">
                    <Button
                        onClick={handlePrint}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-6 rounded-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                    >
                        <Printer className="mr-2 h-5 w-5" /> Generate Official Copy
                    </Button>
                </div>
            </div>

            {/* ── The Masterpiece ── */}
            <div
                id="graduation-certificate"
                className="relative bg-[#fafaf9] text-slate-900 shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden print:shadow-none print:border-none print:!w-[297mm] print:!h-[210mm] print:!max-w-none print:!m-0"
                style={{
                    aspectRatio: '1.414 / 1',
                    width: '100%',
                    maxWidth: '1150px',
                    minHeight: '810px',
                    fontFamily: 'serif'
                }}
            >
                {/* ── Background Patterns ── */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 57c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* ── Decorative Borders ── */}
                <div className="absolute inset-8 border-[1px] border-slate-200 pointer-events-none" />
                <div className="absolute inset-10 border-[16px] border-double border-[#854d0e]/20 pointer-events-none" />

                {/* ── Corner Accents ── */}
                <div className="absolute top-10 left-10 w-24 h-24 border-t-4 border-l-4 border-[#854d0e] pointer-events-none" />
                <div className="absolute top-10 right-10 w-24 h-24 border-t-4 border-r-4 border-[#854d0e] pointer-events-none" />
                <div className="absolute bottom-10 left-10 w-24 h-24 border-b-4 border-l-4 border-[#854d0e] pointer-events-none" />
                <div className="absolute bottom-10 right-10 w-24 h-24 border-b-4 border-r-4 border-[#854d0e] pointer-events-none" />

                {/* ── Content Body ── */}
                <div className="relative h-full flex flex-col px-32 py-10 items-center justify-between pb-24">

                    {/* Top Branding Section */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-3">
                            <div className="h-24 w-24 rounded-full border-2 border-slate-200 bg-white shadow-xl flex items-center justify-center p-2">
                                <GraduationCap className="h-14 w-14 text-[#854d0e]" strokeWidth={1.5} />
                            </div>
                            <Star className="absolute -top-1 -right-1 w-6 h-6 text-[#854d0e] fill-[#ca8a04]" />
                        </div>
                        <p className="text-[10px] font-sans font-black tracking-[0.6em] text-[#854d0e] uppercase mb-1">{SCHOOL_TAGLINE}</p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic leading-none" style={{ letterSpacing: '-0.02em' }}>{SCHOOL_NAME}</h1>
                        <p className="text-[9px] font-sans font-bold text-slate-400 mt-1 uppercase tracking-widest">{SCHOOL_ADDRESS}</p>
                    </div>

                    {/* Certificate Title */}
                    <div className="flex flex-col items-center w-full -mt-4">
                        <div className="flex items-center gap-4 w-full max-w-sm mb-1">
                            <div className="h-[1px] bg-gradient-to-r from-transparent to-slate-300 flex-1" />
                            <h2 className="text-3xl font-bold italic text-slate-800 lowercase font-serif tracking-tight leading-none">Certification of</h2>
                            <div className="h-[1px] bg-gradient-to-l from-transparent to-slate-300 flex-1" />
                        </div>
                        <h3 className="text-6xl font-black uppercase tracking-[0.1em] text-slate-900 leading-none">Graduation</h3>
                    </div>

                    {/* Award Context */}
                    <div className="w-full text-center space-y-8">
                        <p className="text-lg text-slate-600 font-medium italic">
                            By the authority vested in the Academic Board, we hereby certify that
                        </p>

                        <div className="relative py-2">
                            <h4 className="text-7xl font-black text-slate-950 font-serif tracking-tight leading-none">
                                {student.full_name || 'Valued Graduate'}
                            </h4>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-[#854d0e]/30" />
                            <p className="text-[10px] font-sans font-black tracking-[0.4em] text-slate-400 mt-4 uppercase">
                                Identification Roll: {student.roll_number || 'N/A'}
                            </p>
                        </div>

                        <p className="text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed italic pt-2">
                            Has successfully fulfilled all the academic and institutional requirements <br />
                            for the prescribed course of study and is hereby awarded this certificate.
                        </p>
                    </div>

                    {/* Official Sign-offs (Adjusted to 2 columns) */}
                    <div className="w-full grid grid-cols-2 gap-48 mt-4 px-12">
                        {/* Date */}
                        <div className="text-center flex flex-col justify-end pb-2">
                            <p className="text-base font-bold text-slate-900 border-b border-slate-300 inline-block px-2 mb-2">
                                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] font-sans font-black uppercase tracking-[0.3em] text-slate-400">Date of Issuance</p>
                        </div>

                        {/* Headmaster Signature */}
                        <div className="text-center flex flex-col justify-end pb-2">
                            <div className="h-10 flex items-center justify-center italic text-2xl font-serif text-slate-800 opacity-50 translate-y-1">

                            </div>
                            <div className="h-[2px] bg-slate-900 w-full mb-2" />
                            <p className="text-[10px] font-sans font-black uppercase tracking-[0.3em] text-slate-900">Headmaster Signature</p>
                        </div>
                    </div>

                    {/* Digital Integrity Bar */}
                    <div className="absolute bottom-16 left-0 right-0 px-32 flex justify-between items-center opacity-30">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-3 h-3" />
                            <p className="text-[7px] font-mono tracking-widest uppercase leading-none">Verification: {student.id.split('-')[0].toUpperCase()}</p>
                        </div>
                        <p className="text-[7px] font-mono tracking-widest uppercase leading-none">AL-FAZAL ERP SYSTEM</p>
                    </div>
                </div>
            </div>

            {/* Print Settings Override */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4 landscape; }
                    body > *:not(.fixed) { display: none !important; }
                    .fixed.inset-0 { 
                        position: fixed !important; 
                        display: flex !important; 
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        background: white !important; 
                        padding: 0 !important;
                        height: 100vh !important;
                        width: 100vw !important;
                    }
                    .print\\:hidden, .print\\:!hidden {
                        display: none !important;
                    }
                    #graduation-certificate {
                        width: 297mm !important;
                        height: 210mm !important;
                        max-width: none !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        transform: none !important;
                        border: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .animate-spin-slow { animation: none !important; }
                }
                
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
            `}</style>
        </div>
    );

    return createPortal(content, document.body);
}
