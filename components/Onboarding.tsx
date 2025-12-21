import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onComplete: () => void;
    onSkip: () => void;
    onLogin: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete, onSkip, onLogin }) => {
    const [step, setStep] = useState(0);

    const nextStep = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const steps = [
        {
            id: 'intro',
            title: 'Namelime',
            tagline: 'The Studio Standard',
            description: 'Define your startup identity with precision. Built for founders who value exceptional naming.',
            visual: (
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#FF8B66]/10 rounded-full blur-xl animate-pulse" style={{ willChange: 'opacity' }} />
                    <div className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-black/5 rotate-6">
                        <span className="material-symbols-outlined text-[48px] text-[#FF8B66] font-black">token</span>
                    </div>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#121212] rounded-2xl shadow-xl flex items-center justify-center -rotate-12 translate-x-4">
                        <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                    </div>
                </div>
            )
        },
        {
            id: 'challenge',
            title: 'Sprints',
            tagline: 'Creative Velocity',
            description: 'Experience 15-minute branding sprints designed to unlock massive creative potential.',
            visual: (
                <div className="flex justify-center items-center gap-4 py-8">
                    {[0.6, 1, 0.8].map((op, i) => (
                        <div
                            key={i}
                            className="w-1.5 rounded-full bg-[#FF8B66]"
                            style={{ height: i === 1 ? '60px' : '40px', opacity: op }}
                        />
                    ))}
                    <div className="px-8 py-4 bg-white rounded-[2rem] border border-black/5 shadow-sm font-black text-xs tracking-[0.3em] uppercase">
                        15:00
                    </div>
                    {[0.8, 1, 0.6].map((op, i) => (
                        <div
                            key={i}
                            className="w-1.5 rounded-full bg-[#FF8B66]"
                            style={{ height: i === 1 ? '40px' : '60px', opacity: op }}
                        />
                    ))}
                </div>
            )
        },
        {
            id: 'success',
            title: 'Path',
            tagline: 'Select Focus',
            description: 'Choose your entry point into the Namelime naming engine.',
            visual: (
                <div className="space-y-4 w-full">
                    <div className="p-1 bg-gradient-to-r from-[#FF8B66] to-[#FFB399] rounded-[2.2rem]">
                        <div className="bg-white p-5 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                                </div>
                                <span className="font-black text-xs tracking-widest uppercase">Studio Pro</span>
                            </div>
                            <span className="font-black text-sm">$19</span>
                        </div>
                    </div>
                    <div className="bg-black/5 p-6 rounded-[2.2rem] flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">person</span>
                            </div>
                            <span className="font-black text-xs tracking-widest uppercase text-black/40">Basic</span>
                        </div>
                        <span className="font-black text-sm">$0</span>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] bg-[#FAFAFA] text-[#121212] flex flex-col font-sans select-none overflow-hidden h-[100dvh] w-full max-w-md mx-auto left-0 right-0 top-0 bottom-0 shadow-2xl">
            {/* Background Texture & Audio Visual Elements */}
            <div className="noise opacity-[0.03]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,139,102,0.08)_0%,transparent_70%)]" />

            {/* Header */}
            <header className="pt-16 px-10 flex justify-between items-center z-50">
                <div className="w-1 h-8 bg-[#FF8B66]/20 rounded-full flex flex-col justify-end">
                    <motion.div
                        animate={{ height: `${(step + 1) * 33.33}%` }}
                        className="w-full bg-[#FF8B66] rounded-full transition-all duration-700"
                    />
                </div>
                <button
                    onClick={onSkip}
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20 hover:text-[#FF8B66] transition-colors"
                >
                    Dismiss
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center px-12 text-center mt-[-40px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                        className="w-full will-change-transform"
                    >
                        <div className="mb-14 relative z-0">
                            {steps[step].visual}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="will-change-transform"
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#FF8B66] mb-5 block">
                                {steps[step].tagline}
                            </span>

                            <h2 className="text-[4rem] font-black leading-[0.8] tracking-tighter mb-8 text-text-main">
                                {steps[step].title}
                            </h2>

                            <p className="text-black/40 text-[16px] leading-relaxed font-medium max-w-[280px] mx-auto">
                                {steps[step].description}
                            </p>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Controls */}
            <footer className="px-10 pb-20 pt-8 z-50">
                <button
                    onClick={nextStep}
                    className="w-full bg-[#121212] group text-white h-20 rounded-[2.5rem] flex items-center justify-between px-10 font-black text-[14px] uppercase tracking-[0.3em] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:bg-[#FF8B66] transition-all active:scale-[0.98]"
                >
                    <span>{step === 2 ? 'Studio' : 'Next'}</span>
                    <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
                    </div>
                </button>

                <div className="mt-10">
                    <button
                        onClick={onLogin}
                        className="w-full text-[11px] font-black uppercase tracking-[0.2em] text-black/20 hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                        Returning User? <span className="text-black underline decoration-black/10 underline-offset-8">Login</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Onboarding;