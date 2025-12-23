import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Page } from '../types';

interface Props {
    user: User;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

const Settings = ({ user, onLogout, onNavigate }: Props) => {
    if (!user) return null;
    const [pushEnabled, setPushEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored ? stored === 'dark' : true;
    });

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div className="relative min-h-full flex flex-col px-5 pb-40 bg-background transition-colors duration-500">
            {/* Header */}
            <header className="pt-[calc(env(safe-area-inset-top)+0.5rem)] mb-6 flex items-center justify-between">
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FF8B66]">Account Integrity</span>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => onNavigate('admin')}
                            className="mt-2 text-xs font-black bg-surface border border-[#FF8B66]/30 text-[#FF8B66] px-4 py-1.5 rounded-xl uppercase shadow-sm hover:bg-[#FF8B66]/5 transition-all active:scale-95"
                        >
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                                Admin Access
                            </span>
                        </button>
                    )}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <div className="flex-1 max-w-2xl mx-auto w-full space-y-8">
                {/* Profile Card - Academy Style */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-sm border border-border relative overflow-hidden"
                >
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-[2rem] p-1 bg-surface shadow-lg relative z-10">
                            <img src={user.avatarUrl} alt="User" className="w-full h-full rounded-[1.8rem] object-cover" />
                        </div>
                        {/* Decorative Ring */}
                        <div className="absolute -inset-4 border border-[#FF8B66]/20 rounded-[3rem] animate-pulse"></div>
                    </div>

                    <h2 className="text-3xl font-black text-text-main mb-2 tracking-tight">{user.name}</h2>
                    <p className="text-text-muted text-sm font-black uppercase tracking-widest mb-6">{user.email}</p>

                    <div className="flex items-center gap-1 bg-[#FF8B66]/10 px-4 py-2 rounded-full">
                        <span className="material-symbols-outlined text-[#FF8B66] text-sm md-1">verified</span>
                        <span className="text-[11px] font-bold text-[#FF8B66] uppercase tracking-wider">
                            {user.plan === 'free' ? 'Starter Plan' : 'Pro Plan'}
                        </span>
                    </div>
                </motion.div>

                {/* Plan Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-[2.5rem] p-6 shadow-sm border relative overflow-hidden transition-all duration-500 ${user.plan === 'pro'
                        ? 'bg-gradient-to-br from-[#1a1a1a] to-[#09090b] border-[#FF8B66]/20 shadow-premium-dark'
                        : 'bg-surface border-border'
                        }`}
                >
                    {/* Plan Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.plan === 'pro' ? 'bg-[#FF8B66]' : 'bg-background'
                                }`}>
                                <span className={`material-symbols-outlined text-xl ${user.plan === 'pro' ? 'text-white' : 'text-text-main'}`}>
                                    {user.plan === 'pro' ? 'diamond' : 'savings'}
                                </span>
                            </div>
                            <div>
                                <h4 className={`text-base font-black leading-none ${user.plan === 'pro' ? 'text-white' : 'text-text-main'}`}>
                                    {user.plan === 'pro' ? 'Founder Pro' : 'Hobbyist'}
                                </h4>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${user.plan === 'pro' ? 'text-white/50' : 'text-text-muted'}`}>
                                    {user.plan === 'pro' ? (user.planInterval === 'yearly' ? 'Annual' : 'Monthly') : 'Free Plan'}
                                </span>
                            </div>
                        </div>
                        {user.plan === 'pro' && (
                            <span className="bg-[#FF8B66] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase">Active</span>
                        )}
                        {user.plan !== 'pro' && (
                            <button
                                onClick={() => onNavigate('pricing')}
                                className="bg-[#FF8B66] text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase"
                            >
                                Upgrade
                            </button>
                        )}
                    </div>

                    {/* Pro Renewal Info */}
                    {user.plan === 'pro' && user.planExpiresAt && (
                        <div className="bg-[#050505] rounded-xl p-3 flex items-center justify-between border border-white/5">
                            <span className="text-white/40 text-xs font-black uppercase tracking-widest">Next Renewal</span>
                            <div className="text-right">
                                <span className="text-white text-sm font-black block">{new Date(user.planExpiresAt).toLocaleDateString()}</span>
                                <span className="text-[#FF8B66] text-[10px] font-black uppercase">
                                    {Math.ceil((new Date(user.planExpiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days left
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Usage Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="bg-surface rounded-[1.5rem] p-5 border border-border">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-2">Credits</span>
                        <div className="flex items-center gap-1">
                            <span className={`text-xl font-black ${user.plan === 'pro' ? 'text-[#FF8B66]' : 'text-text-main'}`}>
                                {user.plan === 'pro' ? '∞' : user.credits}
                            </span>
                        </div>
                    </div>
                    <div className="bg-surface rounded-[1.5rem] p-5 border border-border">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-2">Today</span>
                        <span className="text-xl font-black text-text-main">{user.generationsTodayCount}</span>
                    </div>
                </motion.div>

                {/* Settings Group */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <p className="px-4 text-[11px] font-bold text-text-muted/50 uppercase tracking-widest">Preferences</p>

                    {/* Dark Mode Toggle */}
                    <div className="bg-surface p-4 rounded-[2rem] flex items-center justify-between border border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-text-main">
                                <span className="material-symbols-outlined">dark_mode</span>
                            </div>
                            <span className="font-bold text-text-main">Dark Theme</span>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            aria-label="Toggle Dark Mode"
                            className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${darkMode ? 'bg-[#FF8B66]' : 'bg-background'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${darkMode ? 'left-[calc(100%-28px)]' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Notifications Toggle */}
                    <div className="bg-surface p-4 rounded-[2rem] flex items-center justify-between border border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-text-main">
                                <span className="material-symbols-outlined">notifications</span>
                            </div>
                            <span className="font-bold text-text-main">Push Alerts</span>
                        </div>
                        <button
                            onClick={() => setPushEnabled(!pushEnabled)}
                            aria-label="Toggle Push Notifications"
                            className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${pushEnabled ? 'bg-[#FF8B66]' : 'bg-background'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${pushEnabled ? 'left-[calc(100%-28px)]' : 'left-1'}`} />
                        </button>
                    </div>
                </motion.div>

                {/* Logout Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="pt-8"
                >
                    <button
                        onClick={onLogout}
                        className="w-full h-16 rounded-[2rem] bg-red-500/5 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        <span>Sign Out</span>
                    </button>
                </motion.div>

            </div>
        </div>
    );
};

export default Settings;