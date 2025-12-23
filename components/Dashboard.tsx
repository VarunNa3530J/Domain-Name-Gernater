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

// Plan-based style restrictions (premium styles that require Pro plan)
const PREMIUM_STYLES: NamingStyle[] = ['Neo-Latin', 'Compound', 'Descriptive', 'Phrase', 'Humorous'];

// Reusable Bottom Sheet for Selection (Portaled)
const SelectionSheet = ({
    isOpen,
    onClose,
    title,
    options,
    selected,
    onSelect,
    isPro = false,
    isStyleSelection = false
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
    isPro?: boolean;
    isStyleSelection?: boolean;
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
                <h3 className="text-xl font-bold text-text-main mb-6 px-4">{title}</h3>
                <div className="grid grid-cols-2 gap-6">
                    {options.map((option) => {
                        const isLocked = isStyleSelection && !isPro && PREMIUM_STYLES.includes(option as NamingStyle);
                        return (
                            <button
                                key={option}
                                onClick={() => {
                                    if (isLocked) {
                                        haptics.notification(NotificationType.Warning);
                                        return;
                                    }
                                    onSelect(option);
                                    haptics.selectionChanged();
                                }}
                                className={`p-4 rounded-[1.2rem] text-left transition-all relative ${selected === option
                                    ? 'bg-text-main text-background shadow-lg ring-2 ring-[#FF8B66]'
                                    : isLocked
                                        ? 'bg-background/50 text-text-muted/40 cursor-not-allowed'
                                        : 'bg-background text-text-muted hover:bg-border'
                                    }`}
                            >
                                <span className="text-[13px] font-bold block">{option}</span>
                                {isLocked && (
                                    <span className="absolute top-2 right-2 text-[9px] font-black text-[#FF8B66] bg-[#FF8B66]/10 px-2 py-0.5 rounded uppercase tracking-wider">Pro</span>
                                )}
                            </button>
                        );
                    })}

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
        <div className="flex justify-between items-center mb-4 px-2">
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

const AdvancedOptions = React.memo(({ targetPlatform, setTargetPlatform }: any) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="gpu-accelerated"
    >
        <div className="flex justify-between items-center mb-5 px-2">
            <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.4em]">Platform Identity</h4>
            <div className="h-[1px] flex-1 bg-border mx-6"></div>
        </div>

        <div className="bg-surface p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 block pl-1">What are you building?</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                    { id: 'App', icon: 'install_mobile', label: 'Mobile App' },
                    { id: 'Website', icon: 'language', label: 'Website / SaaS' },
                    { id: 'YouTube', icon: 'smart_display', label: 'YT Channel' },
                    { id: 'Agency', icon: 'business_center', label: 'Agency' },
                    { id: 'Product', icon: 'inventory_2', label: 'Physical Product' },
                    { id: 'Game', icon: 'sports_esports', label: 'Game Studio' }
                ].map((p) => (
                    <button
                        key={p.id}
                        onClick={() => { setTargetPlatform(p.id); haptics.selectionChanged(); }}
                        className={`p-4 rounded-xl text-left transition-all border flex items-center gap-3 ${targetPlatform === p.id ? 'bg-text-main text-background border-text-main shadow-md' : 'bg-background text-text-muted border-border hover:border-[#FF8B66]/50 hover:text-[#FF8B66]'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
                        <span className="text-[12px] font-bold">{p.label}</span>
                    </button>
                ))}
            </div>
        </div>
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
    const [targetPlatform, setTargetPlatform] = useState('Website'); // Default

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
            target: targetPlatform as any, // Cast for update
            vibe: 'Global',
            maxLength: 'Any'
        });
    };

    return (
        <div className="relative h-full w-full bg-background flex flex-col overflow-hidden">
            <div className="noise opacity-[0.03] pointer-events-none" />

            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-64">
                <header className="px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-7 flex justify-between items-center shrink-0 z-20 sticky top-0 bg-background/80 backdrop-blur-xl">
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
                        {/* Community Pulse Pill */}
                        <div className="hidden md:flex flex-col items-end justify-center mr-2">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Live</span>
                            <span className="text-[11px] font-black text-[#FF8B66] tracking-tight">1.2k Created</span>
                        </div>
                        <button onClick={() => onNavigate('settings')} className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-[#FF8B66] hover:border-[#FF8B66]/30 transition-all shadow-sm active:scale-90">
                            <span className="material-symbols-outlined text-[22px]">settings</span>
                        </button>
                        <button onClick={() => onNavigate('pricing')} className="w-12 h-12 rounded-2xl bg-surface dark:bg-black border border-[#FF8B66]/30 flex items-center justify-center text-[#FF8B66] shadow-xl shadow-[#FF8B66]/5 active:scale-90 hover:border-[#FF8B66] transition-all">
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
                    {/* Masterclass Cards */}
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                        className="overflow-x-auto no-scrollbar -mx-5 px-5 flex gap-4 snap-x"
                    >
                        {[
                            { title: "The Flat Soda Test", desc: "If a name hits you like flat soda, discard it immediately.", icon: "local_drink", color: "from-orange-500 to-red-500" },
                            { title: "No Tofu Names", desc: "Generic names take on the flavor of others. Be distinct.", icon: "do_not_touch", color: "from-purple-500 to-indigo-500" },
                            { title: "The Bar Test", desc: "Can you say it in a loud bar and be understood?", icon: "nightlife", color: "from-blue-500 to-cyan-500" },
                            { title: "Black Hoodie", desc: "Does it look cool printed on a black hoodie?", icon: "checkroom", color: "from-stone-500 to-zinc-900" },
                        ].map((card, i) => (
                            <div key={i} className="snap-center shrink-0 w-64 p-5 rounded-[2rem] bg-surface border border-border relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>
                                <div className="w-10 h-10 rounded-2xl bg-background flex items-center justify-center mb-4 shadow-sm text-text-main">
                                    <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                                </div>
                                <h3 className="text-sm font-black text-text-main mb-1">{card.title}</h3>
                                <p className="text-[11px] font-medium text-text-muted leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                        className={`gpu-accelerated relative bg-surface rounded-[2.8rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] dark:shadow-premium-dark border border-border transition-all duration-500 ${isFocused ? 'ring-4 ring-[#FF8B66]/5 dark:ring-[#FF8B66]/10 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.08)]' : ''}`}
                    >
                        {/* Premium Glow (Dark Mode Only) */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8B66]/20 to-[#EBFF00]/10 rounded-[3rem] blur-2xl opacity-0 dark:opacity-40 pointer-events-none -z-10 animate-pulse-slow"></div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-black text-text-muted uppercase tracking-[0.4em]">Initialize Project</span>
                            {/* Trending Badge */}
                            <div className="flex items-center gap-1.5 bg-[#FF8B66]/10 px-2.5 py-1 rounded-full border border-[#FF8B66]/20">
                                <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-[#FF8B66]"></span>
                                <span className="text-[9px] font-black text-[#FF8B66] uppercase tracking-[0.1em]">Trending</span>
                            </div>
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

                    <DiscoveryHub quickPrompts={config.quickPrompts} onSelect={(p: string) => { setDescription(p); haptics.selectionChanged(); }} />
                    <ConfigurationMatrix selectedStyle={selectedStyle} selectedTone={selectedTone} selectedIndustry={selectedIndustry} selectedAudience={selectedAudience} onOpenModal={setActiveModal} />
                    <AdvancedOptions targetPlatform={targetPlatform} setTargetPlatform={setTargetPlatform} />
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
                        isPro={user.plan === 'pro'}
                        isStyleSelection={activeModal === 'style'}
                    />
                )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none pb-32">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent h-48 bottom-0" />
                <div className="relative px-4 max-w-md mx-auto pointer-events-auto">
                    <motion.button
                        whileHover={description.trim() ? { scale: 1.02, y: -2 } : {}}
                        whileTap={description.trim() ? { scale: 0.98 } : {}}
                        onClick={handleGenerate}
                        disabled={!description.trim()}
                        className={`w-full h-[72px] rounded-[2rem] flex items-center justify-center gap-4 font-black text-[15px] uppercase tracking-[0.3em] transition-all duration-300 relative overflow-hidden group ${description.trim()
                            ? 'bg-gradient-to-r from-[#FF8B66] via-[#FF6B4A] to-[#FF8B66] text-white shadow-[0_20px_50px_-12px_rgba(255,139,102,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(255,139,102,0.6)]'
                            : 'bg-surface border-2 border-dashed border-border text-text-muted/30'
                            }`}
                    >
                        {/* Animated Shine Effect */}
                        {description.trim() && (
                            <motion.div
                                animate={{ x: ['calc(-100% - 100px)', 'calc(100% + 100px)'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear', repeatDelay: 1 }}
                                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] pointer-events-none"
                            />
                        )}

                        {/* Button Content */}
                        <span className="relative z-10">{description.trim() ? 'Generate Names' : 'Enter Concept First'}</span>

                        {description.trim() && (
                            <div className="relative z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </div>
                        )}

                        {/* Glow Ring */}
                        {description.trim() && (
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8B66] to-[#FF6B4A] rounded-[2.2rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
