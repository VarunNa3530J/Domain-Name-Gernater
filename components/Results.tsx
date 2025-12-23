import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedName, User, GenerationRequest } from '../types';
import { haptics } from '../services/hapticsService';
import { NotificationType } from '@capacitor/haptics';

interface Props {
    results: GeneratedName[];
    isLoading: boolean;
    onBack: () => void;
    user: User | null;
    request?: GenerationRequest | null;
}

const Results: React.FC<Props> = ({ results, isLoading, onBack, user, request }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const isPro = user?.plan === 'pro';

    const copyToClipboard = async (text: string, idx: number) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback Copy Error:', err);
                }
                document.body.removeChild(textArea);
            }
            haptics.notification(NotificationType.Success);
            setCopiedIndex(idx);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Clipboard Error:', err);
        }
    };

    // --- Dynamic Words for Loader ---
    const dynamicWords = React.useMemo(() => {
        if (!request) return ["startups", "brands", "ideas", "future", "names"];

        // Extract words from description and keywords
        const sourceText = (request.description + " " + (request.keywords || "")).toLowerCase();
        // Remove common filler words
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        const words = sourceText
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w));

        // Get unique top words
        const uniqueWords = Array.from(new Set(words)).slice(0, 10);

        // Pad if not enough words
        if (uniqueWords.length < 5) {
            return [...uniqueWords, "branding", "naming", "identity", "creative", "premium", "vision"];
        }
        return uniqueWords;
    }, [request]);

    // --- Cycle Words for Smooth Swipe Animation ---
    const [wordIndex, setWordIndex] = useState(0);

    // Filter words to valid ones only (ensure no undefined/empty)
    const validWords = React.useMemo(() => {
        return dynamicWords.filter(w => w && w.length > 0);
    }, [dynamicWords]);

    useEffect(() => {
        if (!isLoading) return;
        const interval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % validWords.length);
        }, 1500); // 1.5s per word for readability and smoothness
        return () => clearInterval(interval);
    }, [isLoading, validWords]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background touch-none">
                {/* Background Details - Subtle & Premium */}
                <div className="absolute inset-0 bg-background z-0" />

                {/* Center Content */}
                <div className="relative z-10 flex flex-col items-center justify-center pl-20">
                    <div className="flex items-center gap-3 text-2xl md:text-3xl font-medium tracking-tight">
                        {/* Static Text - Muted Color to blend/contrast nicely */}
                        <span className="text-text-muted">Thinking</span>

                        {/* Animated Word - Swiping Up */}
                        <div className="relative h-[1.2em] w-48 overflow-hidden flex items-center">
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={validWords[wordIndex]}
                                    initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
                                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                    exit={{ y: -20, opacity: 0, filter: "blur(5px)" }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 180,
                                        damping: 20,
                                        mass: 0.8
                                    }}
                                    className="absolute left-0 font-bold text-[#FF8B66] truncate w-full"
                                >
                                    {validWords[wordIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-background pb-32">
            <div className="px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-5">
                {/* Clean Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className="mb-8 flex items-center justify-between"
                >
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>

                    <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Results</span>
                        <span className="text-lg font-bold text-text-main">{results?.length || 0} Names</span>
                    </div>
                </motion.div>

                {/* Clean Content List */}
                <div className="space-y-4">
                    {results && results.map((item, idx) => {
                        const availableDomains = (item.domains || []).filter(d => d.available).length;

                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: idx * 0.05,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 15,
                                    mass: 0.5
                                }}
                                className="bg-surface rounded-2xl p-6 border border-border hover:border-border/80 transition-all"
                            >
                                {/* Top Section */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        {/* Rank Indicator */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '💡'}
                                            </span>
                                            <span className="px-3 py-1 rounded-lg bg-[#FF8B66]/10 text-[#FF8B66] text-xs font-semibold">
                                                {(item.archetype || 'Idea').split(' ')[0]}
                                            </span>
                                            {isPro && availableDomains > 0 && (
                                                <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold">
                                                    {availableDomains} Available
                                                </span>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <h3 className="text-2xl font-bold text-text-main mb-2 leading-tight">
                                            {item.name}
                                        </h3>

                                        {/* Reasoning */}
                                        <p className="text-text-muted text-sm leading-relaxed">
                                            {item.reasoning}
                                        </p>
                                    </div>

                                    {/* Copy Button */}
                                    <button
                                        onClick={() => copyToClipboard(item.name, idx)}
                                        className="ml-4 w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted hover:text-[#FF8B66] hover:border-[#FF8B66]/30 transition-all flex-shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            {copiedIndex === idx ? 'check' : 'content_copy'}
                                        </span>
                                    </button>
                                </div>

                                {/* Domains - Only for Pro Users */}
                                {isPro ? (
                                    (item.domains || []).length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                                            {item.domains.map((d) => (
                                                <div
                                                    key={d.tld}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${d.available
                                                        ? 'bg-green-500/10 text-green-600'
                                                        : 'bg-red-500/5 text-red-400 opacity-50'
                                                        }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${d.available ? 'bg-green-500' : 'bg-red-400'
                                                        }`}></div>
                                                    .{d.tld}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <div className="pt-4 border-t border-border">
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FF8B66]/5 border border-[#FF8B66]/20">
                                            <span className="material-symbols-outlined text-[#FF8B66] text-xl">lock</span>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-text-main">Domain availability locked</p>
                                                <p className="text-[11px] text-text-muted mt-0.5">Upgrade to Pro to check domain availability</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom Spacer */}
                <div className="h-4"></div>
            </div>
        </div>
    );
};

export default Results;