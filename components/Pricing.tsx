import React, { useState } from 'react';
import { useAppConfig } from '../services/configService';
import { User } from '../types';
import { stripeService } from '../services/stripeService';
import { haptics } from '../services/hapticsService';
import { motion } from 'framer-motion';

interface Props {
    user: User | null;
    onClose: () => void;
}

const Pricing: React.FC<Props> = ({ user, onClose }) => {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
    const { config } = useAppConfig();
    const [loading, setLoading] = useState(false);
    const { pricing } = config;
    const { plans, currency } = pricing;

    const isPro = user?.plan === 'pro';

    const handleUpgrade = async () => {
        if (!user) return;
        setLoading(true);
        haptics.selectionChanged();
        try {
            await stripeService.createCheckoutSession(
                user.id,
                billing === 'monthly' ? 'price_monthly' : 'price_yearly',
                'Founder Pro'
            );
        } catch (err: any) {
            console.error('[Pricing] Upgrade failed:', err);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            alert(`Payment failed to initialize.\n\nError: ${err.message}\nTarget: ${apiUrl}\n\nPlease ensure your phone is on the same WiFi as your computer.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full relative bg-background font-sans pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 pt-[calc(env(safe-area-inset-top)+1.0rem)] bg-background/90 backdrop-blur-xl border-b border-border">
                <div className="w-10"></div>
                <h2 className="text-[15px] font-bold text-text-main uppercase tracking-widest">Pricing</h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-text-main hover:bg-surface-muted/20 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </header>

            <div className="flex flex-col items-center pt-8 px-5 pb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl font-black text-text-main mb-3 tracking-tight leading-tight">
                        Unlock Your <br />
                        <span className="text-[#FF8B66]">Creative Power</span>
                    </h1>
                    <p className="text-text-muted font-bold text-sm max-w-[280px] mx-auto">
                        Get unlimited features and premium naming tools.
                    </p>
                </motion.div>

                {/* Toggle */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface p-1 rounded-full border border-border flex w-full max-w-[300px] mb-10 shadow-sm relative"
                >
                    {/* Active Pill Background */}
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#121212] dark:bg-white rounded-full transition-all duration-300 shadow-sm ${billing === 'monthly' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
                    ></div>

                    <button
                        onClick={() => { setBilling('monthly'); haptics.selectionChanged(); }}
                        className={`flex-1 py-3 rounded-full text-[13px] font-bold uppercase tracking-wider relative z-10 transition-colors ${billing === 'monthly' ? 'text-white dark:text-black' : 'text-black/40 dark:text-white/40'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => { setBilling('yearly'); haptics.selectionChanged(); }}
                        className={`flex-1 py-3 rounded-full text-[13px] font-bold uppercase tracking-wider relative z-10 transition-colors flex items-center justify-center gap-2 ${billing === 'yearly' ? 'text-white dark:text-black' : 'text-black/40 dark:text-white/40'
                            }`}
                    >
                        Yearly
                        <span className={`text-[9px] px-1.5 py-0.5 rounded bg-[#FF8B66] text-white ${billing === 'yearly' ? 'bg-opacity-100' : 'bg-opacity-50'}`}>
                            -20%
                        </span>
                    </button>
                </motion.div>

                <div className="w-full max-w-md space-y-6">
                    {/* Pro Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`relative p-8 rounded-[2.5rem] overflow-hidden border transition-all duration-300 ${isPro
                            ? 'bg-white dark:bg-[#1E1E1E] border-[#FF8B66] shadow-xl shadow-[#FF8B66]/10'
                            : 'bg-[#121212] dark:bg-white border-transparent shadow-2xl'
                            }`}
                    >
                        {/* Background Decorations */}
                        {!isPro && (
                            <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-[#FF8B66]/20 blur-[100px] rounded-full point-events-none"></div>
                        )}

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className={`text-3xl font-black mb-1 ${isPro ? 'text-black dark:text-white' : 'text-white dark:text-black'}`}>
                                        {plans.founder.name}
                                    </h3>
                                    <p className={`text-sm font-bold ${isPro ? 'text-black/40 dark:text-white/40' : 'text-white/40 dark:text-black/40'}`}>
                                        Most Popular
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPro ? 'bg-[#FF8B66]/10 text-[#FF8B66]' : 'bg-[#FF8B66] text-white dark:text-black'
                                    }`}>
                                    <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className={`text-6xl font-black tracking-tighter ${isPro ? 'text-black dark:text-white' : 'text-white dark:text-black'}`}>
                                    {currency}{billing === 'yearly' ? plans.founder.yearlyPrice : plans.founder.monthlyPrice}
                                </span>
                                <span className={`text-lg font-bold ${isPro ? 'text-black/40 dark:text-white/40' : 'text-white/40 dark:text-black/40'}`}>/mo</span>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {plans.founder.perks.map((perk, i) => (
                                    <li key={i} className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPro ? 'bg-[#FF8B66]/10 text-[#FF8B66]' : 'bg-white/10 dark:bg-black/10 text-[#FF8B66]'
                                            }`}>
                                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                        </div>
                                        <span className={`text-[15px] font-medium leading-tight ${isPro ? 'text-black dark:text-white' : 'text-white dark:text-black'}`}>
                                            {perk}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                disabled={isPro || loading}
                                onClick={handleUpgrade}
                                className={`w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isPro
                                    ? 'bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed'
                                    : 'bg-[#FF8B66] text-white hover:shadow-lg hover:shadow-[#FF8B66]/30'
                                    }`}
                            >
                                {loading && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
                                {isPro ? 'Plan Active' : 'Upgrade Now'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-8 rounded-[2.5rem] bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-black dark:text-white">{plans.hobbyist.name}</h3>
                            <span className="text-2xl font-black text-black dark:text-white">{currency}0</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {plans.hobbyist.perks.map((perk, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 text-black/40 dark:text-white/40">
                                        <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                    </div>
                                    <span className="text-[15px] font-medium text-black/60 dark:text-white/60">{perk}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={onClose}
                            className={`w-full h-14 rounded-[1.5rem] font-bold uppercase tracking-widest text-xs border-2 transition-all active:scale-[0.98] ${!isPro
                                ? 'border-black dark:border-white text-black dark:text-white'
                                : 'border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            {isPro ? 'Close' : 'Continue Free'}
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
