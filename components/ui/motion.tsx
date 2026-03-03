'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

// --- Core animation variants (reusable across the app) ---

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.07,
        },
    },
};

// --- Page-level transition wrapper ---
export function PageTransition({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

// --- Staggered list that animates children one by one ---
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            className={className}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
        >
            {children}
        </motion.div>
    );
}

// --- Individual animated item for use inside StaggerList ---
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            className={className}
            variants={fadeInUp}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

// --- Animated number counter for stat cards ---
export function AnimatedNumber({ value }: { value: number }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            {value.toLocaleString()}
        </motion.span>
    );
}
