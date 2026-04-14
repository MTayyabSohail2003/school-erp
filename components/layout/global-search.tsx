'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { NAVIGATION_MAP } from '@/constants/navigation-map';
import { AnimatePresence, motion } from 'framer-motion';

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter logic
    const results = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return NAVIGATION_MAP.filter(item => 
            item.title.toLowerCase().includes(lowerQuery) || 
            item.keywords.some(k => k.toLowerCase().includes(lowerQuery))
        ).slice(0, 8); // Limit to 8 results for UX
    }, [query]);

    // Handle Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (path: string) => {
        router.push(path);
        setIsOpen(false);
        setQuery('');
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
                break;
            case 'Enter':
                e.preventDefault();
                handleNavigate(results[selectedIndex].path);
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="relative w-full group" ref={containerRef}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    placeholder="Search pages (e.g. Fees, Students)..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedIndex(0);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={onKeyDown}
                    className="w-full h-11 pl-11 pr-12 rounded-2xl bg-accent/30 text-foreground border-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 shadow-sm font-medium transition-all duration-300 placeholder:text-muted-foreground/60"
                />
                <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 transition-colors duration-300",
                    isOpen ? "text-primary" : "text-muted-foreground/60"
                )} />
                
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 bg-background/50 text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                    <Command className="h-2.5 w-2.5" />
                    <span>K</span>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && query.trim() && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-border bg-sidebar shadow-2xl backdrop-blur-xl"
                    >
                        <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-thin">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                        Quick Results
                                    </div>
                                    {results.map((item, index) => (
                                        <button
                                            key={item.path}
                                            onClick={() => handleNavigate(item.path)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group/item",
                                                selectedIndex === index 
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1" 
                                                    : "hover:bg-accent/50 text-sidebar-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors",
                                                selectedIndex === index ? "bg-white/20" : "bg-primary/10 text-primary"
                                            )}>
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm truncate">{item.title}</div>
                                                <div className={cn(
                                                    "text-[10px] truncate uppercase tracking-tighter font-medium opacity-60",
                                                    selectedIndex === index ? "text-white" : "text-muted-foreground"
                                                )}>
                                                    {item.keywords.slice(0, 3).join(' • ')}
                                                </div>
                                            </div>
                                            {selectedIndex === index && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/80 pr-1">
                                                    <span>GO</span>
                                                    <CornerDownLeft className="h-3 w-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 px-4 text-center">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/50 mb-3">
                                        <Search className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground pl-2">
                                        No pages found for <span className="text-foreground italic">&quot;{query}&quot;</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Try searching for keywords like &quot;fees&quot; or &quot;attendance&quot;</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Footer Tips */}
                        <div className="px-4 py-2 bg-accent/30 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground/60 font-medium">
                            <div className="flex gap-3">
                                <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-background border border-border">↑↓</kbd> Navigate</span>
                                <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-background border border-border">↵</kbd> Select</span>
                            </div>
                            <span>Esc to close</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
