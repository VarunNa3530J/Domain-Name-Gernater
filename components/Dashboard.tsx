import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, NamingStyle, Tone, GenerationRequest, Page } from '../types';
import { useAppConfig } from '../services/configService';
import { haptics } from '../services/hapticsService';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    user: User;
    onGenerate: (req: GenerationRequest) => void;
    onNavigate: (page: Page) => void;
}

const TONES: Tone[] = ['Premium', 'Fun', 'Modern', 'Bold', 'Minimalist', 'Tech', 'Luxury'];
const INDUSTRIES = ['Tech', 'Food & Beverage', 'Fashion', 'Health', 'Finance', 'Education', 'Entertainment', 'Real Estate', 'Crypto', 'AI'];
const AUDIENCES = ['Gen-Z', 'Millennials', 'Professionals', 'Enterprises (B2B)', 'Consumers (B2C)', 'Global', 'Luxury', 'Budget'];

// Reusable Bottom Sheet for Selection (Portaled)
const SelectionSheet = ({
    isOpen,
    onClose,
    title,
    options,
    selected,
    onSelect
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-surface rounded-t-[2.5rem] p-6 pb-12 shadow-2xl max-h-[70vh] overflow-y-auto border-t border-border"
            >
                <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-8" />
                <h3 className="text-xl font-bold text-text-main mb-6 px-2">{title}</h3>
                <div className="grid grid-cols-2 gap-3">
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                onSelect(option);
                                haptics.selectionChanged();
                            }}
                            className={`p-4 rounded-[1.2rem] text-left transition-all ${selected === option
                                ? 'bg-text-main text-background shadow-lg ring-2 ring-[#FF8B66]'
                                : 'bg-background text-text-muted hover:bg-border'
                                }`}
                        >
                            <span className="text-[13px] font-bold block">{option}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

// --- Memoized Components ---
const DiscoveryHub = React.memo(({ quickPrompts, onSelect }: { quickPrompts: string[], onSelect: (p: string) => void }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="gpu-accelerated"
    >
        <div className="flex justify-between items-center mb-5 px-2">
            <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.4em]">Discovery Hub</h4>
            <div className="h-[1px] flex-1 bg-border mx-6"></div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 scroll-smooth">
            {quickPrompts.map((prompt, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(prompt)}
                    className="shrink-0 px-6 py-4 bg-surface rounded-[1.8rem] text-[13px] font-black text-text-muted border border-border hover:border-[#FF8B66]/30 hover:text-[#FF8B66] hover:shadow-lg transition-all active:scale-95 shadow-sm flex items-center gap-3 group"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8B66]/30 group-hover:bg-[#FF8B66]"></span>
                    {prompt}
                </button>
            ))}
        </div>
    </motion.div>
));

const ConfigurationMatrix = React.memo(({ selectedStyle, selectedTone, selectedIndustry, selectedAudience, onOpenModal }: any) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="gpu-accelerated"
    >
        <div className="flex justify-between items-center mb-5 px-2">
            <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.4em]">Project Matrix</h4>
            <div className="h-[1px] flex-1 bg-border mx-6"></div>
        </div>
        <div className="grid grid-cols-2 gap-5">
            {[
                { id: 'style', label: 'Naming Style', value: selectedStyle, icon: 'edit_note' },
                { id: 'tone', label: 'Brand Tone', value: selectedTone, icon: 'potted_plant' },
                { id: 'industry', label: 'Industry', value: selectedIndustry, icon: 'architecture' },
                { id: 'audience', label: 'Audience', value: selectedAudience, icon: 'groups' }
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => onOpenModal(item.id)}
                    className="bg-surface p-7 rounded-[2.5rem] border border-border text-left shadow-sm active:scale-[0.98] transition-all group hover:shadow-xl dark:hover:shadow-[#FF8B66]/5 hover:translate-y-[-4px] flex flex-col justify-between h-36 gpu-accelerated"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-text-muted uppercase tracking-[0.3em] group-hover:text-[#FF8B66] transition-colors">{item.label}</span>
                        <span className="material-symbols-outlined text-[18px] text-[#FF8B66] opacity-30 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                    </div>
                    <span className="text-[18px] font-black text-text-main leading-tight tracking-[0.02em]">{item.value}</span>
                </button>
            ))}
        </div>
    </motion.div>
));

const PrecisionToggles = React.memo(({ wordCount, setWordCount }: any) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="bg-surface p-2 rounded-[2.5rem] border border-border flex shadow-lg shadow-black/[0.02] gpu-accelerated"
    >
        {(['1-word', '2-word', 'both'] as const).map((mode) => (
            <button
                key={mode}
                onClick={() => setWordCount(mode)}
                className={`flex-1 h-14 rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] transition-all ${wordCount === mode ? 'bg-text-main text-background shadow-xl translate-y-[-1px]' : 'text-text-muted hover:text-text-main'}`}
            >
                {mode.replace('-', ' ')}
            </button>
        ))}
    </motion.div>
));

const Dashboard: React.FC<Props> = ({ user, onGenerate, onNavigate }) => {
    if (!user) return null;
    const { config } = useAppConfig();
    const [description, setDescription] = useState('');
    const [keywords, setKeywords] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [wordCount, setWordCount] = useState<'1-word' | '2-word' | 'both'>('both');
    const [activeModal, setActiveModal] = useState<'style' | 'tone' | 'industry' | 'audience' | null>(null);
    const [selectedStyle, setSelectedStyle] = useState('Modern');
    const [selectedTone, setSelectedTone] = useState('Professional');
    const [selectedIndustry, setSelectedIndustry] = useState('Tech');
    const [selectedAudience, setSelectedAudience] = useState('General');

    const handleGenerate = () => {
        if (!description.trim()) {
            haptics.notification(NotificationType.Error);
            return;
        }
        haptics.impact(ImpactStyle.Heavy);
        onGenerate({
            description,
            keywords,
            style: selectedStyle as NamingStyle,
            tone: selectedTone as Tone,
            industry: selectedIndustry,
            audience: selectedAudience,
            wordCount,
            target: 'Business',
            vibe: 'Global',
            maxLength: 'Any'
        });
    };

    return (
        <div className="relative h-full w-full bg-background flex flex-col overflow-hidden">
            <div className="noise opacity-[0.03] pointer-events-none" />

            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-64">
                <header className="px-5 pt-[calc(env(safe-area-inset-top)+1.0rem)] pb-7 flex justify-between items-center shrink-0 z-20 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/50">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        className="flex items-center gap-4"
                    >
                        <div className="relative group cursor-pointer" onClick={() => onNavigate('settings')}>
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface shadow-xl border border-border p-1 gpu-accelerated">
                                <img
                                    src={user.avatarUrl}
                                    referrerPolicy="no-referrer"
                                    alt={user.name}
                                    className="w-full h-full object-cover rounded-[1.2rem]"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF8B66] rounded-full border-[4px] border-background shadow-sm"></div>
                        </div>
                        <div>
                            <h2 className="text-[22px] font-black text-text-main leading-tight tracking-tighter dark:text-gradient-premium">
                                {user.name.split(' ')[0]}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#FF8B66] uppercase tracking-[0.2em]">Senior Architect</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
                        className="flex gap-2"
                    >
                        <button onClick={() => onNavigate('settings')} className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-[#FF8B66] hover:border-[#FF8B66]/30 transition-all shadow-sm active:scale-90">
                            <span className="material-symbols-outlined text-[22px]">settings</span>
                        </button>
                        <button onClick={() => onNavigate('pricing')} className="w-12 h-12 rounded-2xl bg-[#121212] border border-[#FF8B66]/20 flex items-center justify-center text-[#FF8B66] shadow-xl active:scale-90">
                            <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                        </button>
                    </motion.div>
                </header>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
                    }}
                    className="flex flex-col gap-10 w-full max-w-2xl mx-auto px-5 relative z-10"
                >
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                        className={`gpu-accelerated relative bg-surface rounded-[2.8rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] dark:shadow-premium-dark border border-border transition-all duration-500 ${isFocused ? 'ring-4 ring-[#FF8B66]/5 dark:ring-[#FF8B66]/10 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.08)]' : ''}`}
                    >
                        {/* Premium Glow (Dark Mode Only) */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8B66]/20 to-[#EBFF00]/10 rounded-[3rem] blur-2xl opacity-0 dark:opacity-40 pointer-events-none -z-10 animate-pulse-slow"></div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-black text-text-muted uppercase tracking-[0.4em]">Initialize Project</span>
                            <div className="px-3 py-1 rounded-full bg-background text-[10px] font-black text-[#FF8B66] uppercase tracking-[0.2em] border border-[#FF8B66]/20">LIVE ENGINE</div>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Describe your startup concept..."
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-3xl font-black placeholder:text-text-muted/40 min-h-[140px] resize-none text-text-main leading-[1.1] tracking-tighter"
                        />
                        <div className="pt-8 mt-4 border-t border-border space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[16px] text-text-muted/30">tag</span>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="Core keywords (optional)..."
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-black tracking-tight text-text-muted placeholder:text-text-muted/20"
                                />
                            </div>
                        </div>
                    </motion.div>

                    <DiscoveryHub quickPrompts={config.quickPrompts} onSelect={(p) => { setDescription(p); haptics.selectionChanged(); }} />
                    <ConfigurationMatrix selectedStyle={selectedStyle} selectedTone={selectedTone} selectedIndustry={selectedIndustry} selectedAudience={selectedAudience} onOpenModal={setActiveModal} />
                    <PrecisionToggles wordCount={wordCount} setWordCount={(m: any) => { setWordCount(m); haptics.selectionChanged(); }} />
                </motion.div>
            </div>

            <AnimatePresence mode="wait">
                {activeModal && (
                    <SelectionSheet
                        key="selection-sheet"
                        isOpen={true}
                        onClose={() => setActiveModal(null)}
                        title={activeModal === 'style' ? 'Select Naming Style' : activeModal === 'tone' ? 'Select Brand Tone' : activeModal === 'industry' ? 'Select Industry' : 'Select Target Audience'}
                        options={activeModal === 'style' ? config.featuredStyles.map((s: any) => s.id) : activeModal === 'tone' ? TONES : activeModal === 'industry' ? INDUSTRIES : AUDIENCES}
                        selected={activeModal === 'style' ? selectedStyle : activeModal === 'tone' ? selectedTone : activeModal === 'industry' ? selectedIndustry : selectedAudience}
                        onSelect={(val) => {
                            if (activeModal === 'style') setSelectedStyle(val);
                            else if (activeModal === 'tone') setSelectedTone(val);
                            else if (activeModal === 'industry') setSelectedIndustry(val);
                            else setSelectedAudience(val);
                            setActiveModal(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none pb-32">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent h-48 bottom-0" />
                <div className="relative px-8 max-w-md mx-auto pointer-events-auto">
                    <motion.button
                        whileHover={description.trim() ? { scale: 1.02, y: -4 } : {}}
                        whileTap={description.trim() ? { scale: 0.98 } : {}}
                        onClick={handleGenerate}
                        disabled={!description.trim()}
                        className={`w-full h-20 rounded-[2.2rem] flex items-center justify-between px-10 font-black text-[14px] uppercase tracking-[0.4em] transition-all duration-500 relative overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] ${description.trim() ? 'bg-text-main text-background hover:opacity-90' : 'bg-surface border-2 border-dashed border-border text-text-muted/20'}`}
                    >
                        {description.trim() && (
                            <motion.div animate={{ x: ['100%', '-100%'] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        )}
                        <span className="relative z-10">Generate</span>
                        {description.trim() && <div className="absolute top-0 right-8 h-[2px] w-12 bg-gradient-to-r from-transparent via-[#FF8B66] to-transparent animate-pulse" />}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
