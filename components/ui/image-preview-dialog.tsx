'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Maximize2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImagePreviewDialogProps {
    src: string | null | undefined;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function ImagePreviewDialog({ src, title, description, children }: ImagePreviewDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleDownload = async () => {
        if (!src) return;
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_image.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    {children}
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-zinc-950/90 backdrop-blur-3xl border-white/10 shadow-2xl rounded-[2.5rem]">
                <DialogHeader className="p-6 border-b border-white/10 bg-white/5 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-black text-white tracking-widest uppercase italic">
                            {title}
                        </DialogTitle>
                        {description && (
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1 italic">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-primary hover:text-white transition-all active:scale-95"
                            onClick={handleDownload}
                            title="Download Image"
                        >
                            <Download className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative aspect-square md:aspect-video w-full flex items-center justify-center p-4 md:p-8">
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="relative w-full h-full flex items-center justify-center"
                            >
                                {src ? (
                                    <img
                                        src={src}
                                        alt={title}
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-white/20">
                                        <User className="w-32 h-32 mb-4" />
                                        <p className="font-black uppercase tracking-widest text-sm italic">No Image Available</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic">
                        <Maximize2 className="w-3 h-3" />
                        Secure High-Resolution Analytics Preview
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
