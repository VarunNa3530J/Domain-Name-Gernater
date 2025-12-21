import React from 'react';
import { motion } from 'framer-motion';
import { GeneratedName } from '../types';
import { haptics } from '../services/hapticsService';
import { NotificationType } from '@capacitor/haptics';

interface Props {
    results: GeneratedName[];
    isLoading: boolean;
    onBack: () => void;
}

const Results: React.FC<Props> = ({ results, isLoading, onBack }) => {
    const copyToClipboard = async (text: string) => {
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
        } catch (err) {
            console.error('Clipboard Error:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-background">
                <div className="relative z-10 flex flex-col items-center px-8 text-center">
                    <div className="w-16 h-16 bg-surface rounded-[2rem] flex items-center justify-center mb-8 shadow-xl animate-bounce border border-border">
                        <span className="material-symbols-outlined text-[#FF8B66] text-3xl">auto_awesome</span>
                    </div>
                    <h2 className="text-2xl font-black text-text-main mb-2">Generating Vision...</h2>
                    <p className="text-text-muted text-sm font-black uppercase tracking-widest animate-pulse">Neural engine active (approx. 5s)</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full relative bg-background font-sans pb-32">
            <div className="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+1.0rem)] pb-5 flex flex-col">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-center justify-between"
                >
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-[#FF8B66] uppercase tracking-[0.2em] mb-1">Curation Results</span>
                        <span className="text-lg font-black text-text-main uppercase tracking-tight">{results?.length || 0} Entities Found</span>
                    </div>
                </motion.div>

                {/* Content List */}
                <div className="space-y-6">
                    {results && results.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-surface rounded-[2.5rem] p-8 shadow-sm border border-border group relative overflow-hidden"
                        >
                            <div className="absolute top-6 right-6 flex gap-2">
                                <button
                                    onClick={() => copyToClipboard(item.name)}
                                    className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-text-muted hover:text-[#FF8B66] transition-colors border border-border"
                                >
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                            </div>

                            <span className="inline-block px-4 py-1.5 rounded-xl bg-background border border-[#FF8B66]/30 text-[#FF8B66] text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                                {(item.archetype || 'Idea').split(' ')[0]}
                            </span>

                            <h3 className="text-3xl font-black text-text-main tracking-tight mb-2 leading-none">{item.name}</h3>
                            <p className="text-text-muted text-sm leading-relaxed mb-6 max-w-[95%] font-medium">
                                {item.reasoning}
                            </p>

                            <div className="flex items-center gap-2">
                                {(item.domains || []).map(d => (
                                    <div key={d.tld} className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-[0.1em] flex items-center gap-2 border ${d.available ? 'bg-green-500/5 text-green-600 border-green-500/20' : 'bg-red-500/5 text-red-400 border-red-500/10 line-through'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${d.available ? 'bg-green-500' : 'bg-red-400'}`}></div>
                                        .{d.tld.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Results;