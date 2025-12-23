// ... imports remain the same, ensuring AnimatePresence is imported
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

interface Props {
    currentUser: User;
    onBack: () => void;
}

// Console Log Capture (Keep existing logic)
const consoleLogs: string[] = [];
if (typeof window !== 'undefined') {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
        consoleLogs.push(`[LOG] ${args.map(a => JSON.stringify(a)).join(' ')}`);
        originalLog(...args);
    };

    console.error = (...args) => {
        consoleLogs.push(`[ERROR] ${args.map(a => JSON.stringify(a)).join(' ')}`);
        originalError(...args);
    };

    window.onerror = (message, source, lineno, colno) => {
        consoleLogs.push(`[CRASH] ${message} at ${source}:${lineno}:${colno}`);
    };
}

const Admin = ({ onBack }: Props) => {
    const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'console'>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [editName, setEditName] = useState<string>('');
    const [editCredits, setEditCredits] = useState<string>('');
    const [editPlan, setEditPlan] = useState<'free' | 'pro'>('free');
    const [editPlanInterval, setEditPlanInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [editPlanExpiresAt, setEditPlanExpiresAt] = useState<string>('');
    const [editGenerationsToday, setEditGenerationsToday] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

    // PIN Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    // Fetch Users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const usersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    joinedAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
                }));
                setUsers(usersList);
            } catch (err) {
                console.error("Admin Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'users' || activeTab === 'analytics') {
            fetchUsers();
        }
    }, [activeTab]);

    const handlePinSubmit = (value: string) => {
        if (value.length < 4) {
            setPin(prev => prev + value);
            const newPin = pin + value;
            if (newPin.length === 4) {
                if (newPin === '2024') {
                    setTimeout(() => setIsAuthenticated(true), 300);
                } else {
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 500);
                }
            }
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    if (!isAuthenticated) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center p-6 text-center font-mono select-none overflow-hidden"
            >
                {/* Holographic Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(var(--text-main)_1px,transparent_1px),linear-gradient(90deg,var(--text-main)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none perspective-[1000px] transform-style-3d rotate-x-[60deg] scale-150 opacity-5"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none"></div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="relative mb-16"
                >
                    <div className="w-28 h-28 rounded-full border border-[#FF8B66]/30 bg-[#FF8B66]/5 shadow-[0_0_30px_rgba(255,139,102,0.1)] flex items-center justify-center relative backdrop-blur-sm animate-pulse-slow">
                        <div className="absolute inset-2 border border-[#FF8B66]/20 rounded-full border-dashed animate-spin-slow"></div>
                        <span className="material-symbols-outlined text-5xl text-[#FF8B66] drop-shadow-[0_0_10px_rgba(255,139,102,0.5)]">security</span>
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-[#FF8B66] text-xs font-bold tracking-[0.5em] uppercase mb-12 drop-shadow-[0_0_5px_rgba(255,139,102,0.5)]"
                >
                    Restricted Access
                </motion.h2>

                {/* PIN Dots */}
                <div className={`flex gap-6 mb-16 transition-transform duration-100 ${error ? 'translate-x-[-10px]' : ''}`}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full border border-[#FF8B66]/50 transition-all duration-300 ${pin.length > i
                            ? 'bg-[#FF8B66] scale-125 shadow-[0_0_10px_#FF8B66]'
                            : 'bg-transparent scale-100 opacity-30'
                            }`}></div>
                    ))}
                </div>

                {/* Holographic Keypad */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[300px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, i) => (
                        <motion.button
                            key={num}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + (i * 0.05) }}
                            onClick={() => handlePinSubmit(num.toString())}
                            className="w-16 h-16 rounded-xl border border-border bg-surface text-2xl font-light text-text-main hover:bg-[#FF8B66]/10 hover:border-[#FF8B66]/50 hover:text-[#FF8B66] active:scale-95 transition-all flex items-center justify-center backdrop-blur-md shadow-lg"
                        >
                            {num}
                        </motion.button>
                    ))}
                    <div className="w-16 h-16"></div> {/* Spacer */}
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        onClick={() => handlePinSubmit('0')}
                        className="w-16 h-16 rounded-xl border border-border bg-surface text-2xl font-light text-text-main hover:bg-[#FF8B66]/10 hover:border-[#FF8B66]/50 hover:text-[#FF8B66] active:scale-95 transition-all flex items-center justify-center backdrop-blur-md shadow-lg"
                    >
                        0
                    </motion.button>
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        onClick={handleBackspace}
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-text-muted hover:text-red-400 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-2xl">backspace</span>
                    </motion.button>
                </div>

                <button
                    onClick={onBack}
                    className="mt-16 text-[10px] font-bold text-text-muted hover:text-text-main uppercase tracking-[0.2em] transition-colors"
                >
                    Abort Sequence
                </button>
            </motion.div>
        );
    }

    const handleSaveUser = async (userId: string) => {
        try {
            const updateData: any = {
                name: editName,
                credits: parseInt(editCredits),
                plan: editPlan,
                generationsTodayCount: parseInt(editGenerationsToday)
            };

            if (editPlan === 'pro') {
                updateData.planInterval = editPlanInterval;
                updateData.planExpiresAt = editPlanExpiresAt ? new Date(editPlanExpiresAt).toISOString() : null;
            }

            await updateDoc(doc(db, 'users', userId), updateData);

            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? {
                ...u,
                ...updateData,
                planExpiresAt: editPlanExpiresAt ? new Date(editPlanExpiresAt).getTime() : null
            } : u));
            setEditingUser(null);
            setToast({ message: 'Protocol: Update Successful', type: 'success' });
        } catch (e) {
            console.error("Update failed", e);
            setToast({ message: 'Protocol: Update Failed', type: 'error' });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete User?",
            message: "CRITICAL WARNING: This will permanently delete this user and all their data from the database. This action cannot be undone.",
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    await deleteDoc(doc(db, 'users', userId));
                    setUsers(prev => prev.filter(u => u.id !== userId));
                    setSelectedUser(null);
                    setToast({ message: 'Entity Purged.', type: 'success' });
                } catch (err) {
                    console.error("Deletion failed:", err);
                    setToast({ message: 'Purge Failed.', type: 'error' });
                }
            }
        });
    };

    const handleResetCredits = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), { credits: 10, generationsTodayCount: 0 });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: 10, generationsTodayCount: 0 } : u));
            setToast({ message: 'Credits Baseline Restored.', type: 'success' });
        } catch (err) {
            console.error("Reset failed:", err);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (u.id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full bg-background text-text-main overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 px-5 py-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-xl">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:bg-border hover:text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm font-bold text-text-main uppercase tracking-[0.2em]">Command Center</h1>
                    <span className="text-[9px] text-text-muted font-mono">v2.4.0.ALPHA</span>
                </div>
                <div className="w-10" />
            </header>

            {/* Tabs & Search */}
            <div className="p-4 bg-surface border-b border-border space-y-4">
                <div className="flex gap-2 p-1 bg-background rounded-xl border border-border">
                    {(['users', 'analytics', 'console'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-[#FF8B66] text-white shadow-[0_0_15px_rgba(255,139,102,0.4)]'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'users' && (
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px] group-focus-within:text-[#FF8B66] transition-colors">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="QUERY DATABASE..."
                            className="w-full h-11 bg-background border border-border rounded-xl pl-10 pr-4 text-xs font-mono text-text-main focus:border-[#FF8B66]/50 transition-all placeholder:text-text-muted/40 outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'users' ? (
                    <div className="space-y-3">
                        {loading && <div className="text-center p-8 text-xs font-mono text-[#FF8B66] animate-pulse">Scanning Neural Network...</div>}

                        {!loading && filteredUsers.map(u => (
                            <motion.div
                                key={u.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => !editingUser && setSelectedUser(u)}
                                className={`bg-surface p-4 rounded-2xl border border-border backdrop-blur-sm transition-all shadow-sm ${!editingUser ? 'hover:bg-border/40 hover:border-[#FF8B66]/30 cursor-pointer active:scale-[0.99]' : ''}`}
                            >
                                {/* User Row */}
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden">
                                            {u.avatarUrl ? <img src={u.avatarUrl} alt="User avatar" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-text-muted">{(u.name?.[0] || 'U')}</span>}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${u.plan === 'pro' ? 'bg-[#FF8B66]' : 'bg-text-muted/20'}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-text-main truncate">{u.name || 'Unknown Entity'}</h3>
                                        <p className="text-[10px] text-text-muted font-mono truncate">{u.email}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface border border-border shadow-inner">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse"></span>
                                            <span className="text-[10px] font-mono text-[#00FF41] font-bold">{u.credits ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : activeTab === 'analytics' ? (
                    <div className="space-y-5 pb-8">
                        {/* Header with Calendar Icon */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-text-main tracking-tight">Analytics</h2>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted shadow-sm hover:text-text-main"
                            >
                                <span className="material-symbols-outlined">calendar_month</span>
                            </motion.button>
                        </div>

                        {/* Period Selector Tabs */}
                        <div className="flex gap-2">
                            {['24h', 'Week', 'Month', '6 months'].map((period, i) => (
                                <motion.button
                                    key={period}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${i === 1
                                        ? 'bg-text-main text-background'
                                        : 'bg-surface text-text-muted border border-border hover:bg-border/20'
                                        }`}
                                >
                                    {period}
                                </motion.button>
                            ))}
                        </div>

                        {/* Monthly Budget Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-surface p-5 rounded-2xl border border-border shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-base font-bold text-text-main">Monthly Usage</h3>
                                    <p className="text-[11px] text-text-muted mt-0.5">{new Date().toLocaleString('default', { month: 'long' })}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-[#4FFFB0]">
                                        {users.reduce((acc, u) => acc + (u.generationsTodayCount || 0), 0) * 7}
                                    </div>
                                    <div className="text-[11px] text-text-muted">
                                        <span className="text-[#4FFFB0] font-bold">{users.reduce((acc, u) => acc + (u.credits || 0), 0)}</span> credits left
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Premium Bar Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative py-4"
                        >
                            {/* Bars Container with Day Labels */}
                            <div className="flex items-end justify-between gap-3 px-2" style={{ height: '200px' }}>
                                {(() => {
                                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                                    // Generate last 7 days data
                                    const chartData = Array.from({ length: 7 }).map((_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - i));
                                        const dayName = days[d.getDay()];

                                        // Count signups on this day
                                        const count = users.filter(u => {
                                            const joinedDate = new Date(u.joinedAt);
                                            return joinedDate.toDateString() === d.toDateString();
                                        }).length;

                                        return {
                                            day: dayName,
                                            value: Math.max(10, count * 50), // Scale for visibility, min 10px
                                            realCount: count,
                                            active: d.toDateString() === new Date().toDateString()
                                        };
                                    });

                                    return chartData.map((item, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                            {/* Tooltip for active bar */}
                                            {item.active && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.8 }}
                                                    className="mb-2 bg-[#4FFFB0] text-black px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg shadow-[#4FFFB0]/30 relative"
                                                >
                                                    {users.reduce((acc, u) => acc + (u.generationsTodayCount || 0), 0)}
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#4FFFB0] rotate-45" />
                                                </motion.div>
                                            )}

                                            {/* Bar */}
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: item.value }}
                                                transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                                                className="w-full max-w-[32px] rounded-t-xl relative overflow-hidden"
                                                style={{
                                                    background: item.active
                                                        ? 'linear-gradient(180deg, #4FFFB0 0%, #00C9A7 40%, #1A4A40 100%)'
                                                        : 'linear-gradient(180deg, #3A4A50 0%, #2A3A3A 50%, #1A2525 100%)',
                                                    boxShadow: item.active ? '0 0 25px rgba(79,255,176,0.5)' : 'none',
                                                }}
                                            >
                                                {/* Shine Effect */}
                                                <div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                    style={{ transform: 'skewX(-15deg) translateX(-100%)', animation: item.active ? 'shine 2s infinite' : 'none' }}
                                                />
                                            </motion.div>

                                            {/* Day Label */}
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 + i * 0.05 }}
                                                className={`text-center text-[10px] font-bold mt-3 ${item.active ? 'text-text-main' : 'text-text-muted'}`}
                                            >
                                                {item.day}
                                            </motion.span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </motion.div>

                        {/* Overview Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Overview</h3>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>

                            {/* User Activity Items */}
                            <div className="grid grid-cols-1 gap-3">
                                {/* Pro Subscriptions */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8B66] to-[#FF6B4A] flex items-center justify-center shadow-lg shadow-[#FF8B66]/30">
                                            <span className="material-symbols-outlined text-white text-lg">workspace_premium</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text-main">Pro Subscriptions</div>
                                            <div className="h-1.5 w-24 bg-background rounded-full mt-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${users.length ? (users.filter(u => u.plan === 'pro').length / users.length * 100) : 0}%` }}
                                                    transition={{ delay: 0.8, duration: 1 }}
                                                    className="h-full bg-gradient-to-r from-[#FF8B66] to-[#FF6B4A] rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-[#FF8B66]">{users.filter(u => u.plan === 'pro').length}</span>
                                </motion.div>

                                {/* Credits Usage */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-[#4FFFB0]/10 to-transparent rounded-2xl border border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4FFFB0] to-[#00C9A7] flex items-center justify-center shadow-lg shadow-[#4FFFB0]/30">
                                            <span className="material-symbols-outlined text-black text-lg">token</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text-main">Total Credits</div>
                                            <div className="h-1.5 w-24 bg-border rounded-full mt-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '75%' }}
                                                    transition={{ delay: 0.9, duration: 1 }}
                                                    className="h-full bg-gradient-to-r from-[#4FFFB0] to-[#00C9A7] rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-[#4FFFB0]">{users.reduce((acc, u) => acc + (u.credits || 0), 0)}</span>
                                </motion.div>

                                {/* Generations Today */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-2xl border border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                            <span className="material-symbols-outlined text-white text-lg">bolt</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text-main">Generations Today</div>
                                            <div className="h-1.5 w-24 bg-border rounded-full mt-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '60%' }}
                                                    transition={{ delay: 1, duration: 1 }}
                                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-700 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-purple-400">{users.reduce((acc, u) => acc + (u.generationsTodayCount || 0), 0)}</span>
                                </motion.div>

                                {/* Active Users */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 }}
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl border border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                            <span className="material-symbols-outlined text-white text-lg">group</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text-main">Total Users</div>
                                            <div className="h-1.5 w-24 bg-border rounded-full mt-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ delay: 1.1, duration: 1 }}
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-blue-400">{users.length}</span>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Top Users Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="bg-surface p-5 rounded-2xl border border-border mt-4 shadow-sm"
                        >
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-sm text-yellow-400">star</span>
                                Top Users
                            </h3>
                            <div className="space-y-2">
                                {[...users].sort((a, b) => (b.credits || 0) - (a.credits || 0)).slice(0, 5).map((user, i) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.1 + i * 0.1 }}
                                        className="flex items-center justify-between p-3 bg-background rounded-xl hover:bg-border transition-colors border border-border/50 shadow-inner"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/30' :
                                                i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                                                    i === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' :
                                                        'bg-border text-text-muted'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-text-main truncate max-w-[120px]">{user.displayName || user.email?.split('@')[0] || 'User'}</div>
                                                <div className="text-[9px] text-text-muted">{user.plan === 'pro' ? '⭐ Pro' : 'Free'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-[#4FFFB0]">{user.credits || 0}</div>
                                            <div className="text-[8px] text-text-muted uppercase">credits</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Summary Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            <div className="bg-gradient-to-br from-[#4FFFB0]/10 to-transparent p-4 rounded-2xl border border-[#4FFFB0]/20 text-center shadow-sm">
                                <div className="text-2xl font-black text-[#4FFFB0]">
                                    {users.length ? Math.round(users.filter(u => u.plan === 'pro').length / users.length * 100) : 0}%
                                </div>
                                <div className="text-[10px] text-text-muted font-bold uppercase mt-1">Conversion</div>
                            </div>
                            <div className="bg-gradient-to-br from-[#FF8B66]/10 to-transparent p-4 rounded-2xl border border-[#FF8B66]/20 text-center shadow-sm">
                                <div className="text-2xl font-black text-[#FF8B66]">
                                    ${users.filter(u => u.plan === 'pro').length * 19}
                                </div>
                                <div className="text-[10px] text-text-muted font-bold uppercase mt-1">MRR</div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="bg-[#050505] text-[#00FF41] p-5 rounded-2xl font-mono text-[10px] h-full overflow-y-auto border border-border shadow-2xl flex flex-col">
                        <div className="mb-4 text-[#00FF41] uppercase tracking-[0.2em] font-black border-b border-[#00FF41]/10 pb-3 flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></span>
                                TERMINAL_OUTPUT_STREAM
                            </span>
                            <span className="text-[9px] opacity-70">Baud: 9600</span>
                        </div>
                        {consoleLogs.map((log, i) => (
                            <div key={i} className="mb-1 opacity-80 break-all hover:opacity-100 hover:bg-[#00FF41]/5 px-1 rounded transition-colors">
                                <span className="opacity-50 mr-2">{'>'}</span> {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected User Modal (Sheet) */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] bg-background flex flex-col pt-safe"
                    >
                        <header className="p-6 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-xl">
                            <button
                                onClick={() => { setSelectedUser(null); setEditingUser(null); }}
                                className="text-text-muted hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <h2 className="text-xs font-bold text-text-main uppercase tracking-[0.3em] text-[#FF8B66]">Entity Details</h2>
                            <button
                                onClick={() => {
                                    if (editingUser === selectedUser.id) {
                                        handleSaveUser(selectedUser.id);
                                    } else {
                                        setEditingUser(selectedUser.id);
                                        setEditName(selectedUser.name || '');
                                        setEditCredits((selectedUser.credits ?? 0).toString());
                                        setEditPlan(selectedUser.plan || 'free');
                                        setEditPlanInterval(selectedUser.planInterval || 'monthly');
                                        setEditPlanExpiresAt(selectedUser.planExpiresAt ? new Date(selectedUser.planExpiresAt).toISOString().split('T')[0] : '');
                                        setEditGenerationsToday((selectedUser.generationsTodayCount ?? 0).toString());
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${editingUser === selectedUser.id
                                    ? 'bg-[#FF8B66] border-[#FF8B66] text-white hover:bg-[#FF8B66]/90 shadow-lg shadow-[#FF8B66]/20'
                                    : 'border-border text-text-main hover:bg-surface'
                                    }`}
                            >
                                {editingUser === selectedUser.id ? 'Confirm' : 'Edit'}
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                            {/* Avatar & Name */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full border-2 border-[#FF8B66] p-1 shadow-[0_0_30px_rgba(255,139,102,0.1)]">
                                    <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden border border-border shadow-sm">
                                        {selectedUser.avatarUrl ? <img src={selectedUser.avatarUrl} alt="User avatar" className="w-full h-full object-cover" /> : <span className="text-2xl text-text-muted">{(selectedUser.name?.[0] || 'U')}</span>}
                                    </div>
                                </div>
                                <div className="text-center">
                                    {editingUser === selectedUser.id ? (
                                        <input value={editName} onChange={e => setEditName(e.target.value)} aria-label="Edit name" placeholder="Enter name" className="bg-transparent border-b border-[#FF8B66] text-text-main text-xl font-bold text-center outline-none w-full" />
                                    ) : (
                                        <h3 className="text-xl font-bold text-text-main">{selectedUser.name || 'Unknown Entity'}</h3>
                                    )}
                                    <p className="text-xs font-mono text-text-muted mt-1">{selectedUser.email}</p>
                                </div>
                            </div>

                            {/* Stats Grid - Row 1 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden shadow-sm">
                                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#00FF41]/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#00FF41] text-sm">token</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Credits</span>
                                    {editingUser === selectedUser.id ? (
                                        <input type="number" value={editCredits} onChange={e => setEditCredits(e.target.value)} aria-label="Edit credits" placeholder="0" className="w-full bg-background text-text-main border border-border rounded-lg p-2 font-mono text-xl" />
                                    ) : (
                                        <div className="text-3xl font-black text-[#00FF41] tracking-tight">{selectedUser.credits ?? 0}</div>
                                    )}
                                </div>
                                <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all shadow-sm ${selectedUser.plan === 'pro' ? 'bg-gradient-to-br from-[#FF8B66]/10 to-transparent border-[#FF8B66]/30' : 'bg-surface border-border'}`}>
                                    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${selectedUser.plan === 'pro' ? 'bg-[#FF8B66]/20' : 'bg-background'}`}>
                                        <span className={`material-symbols-outlined text-sm ${selectedUser.plan === 'pro' ? 'text-[#FF8B66]' : 'text-text-muted'}`}>workspace_premium</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Plan</span>
                                    {editingUser === selectedUser.id ? (
                                        <select value={editPlan} onChange={e => setEditPlan(e.target.value as any)} aria-label="Select plan" className="w-full bg-background text-text-main border border-border rounded-lg p-2 text-lg font-bold">
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                        </select>
                                    ) : (
                                        <div className={`text-2xl font-black uppercase tracking-tight ${selectedUser.plan === 'pro' ? 'text-[#FF8B66]' : 'text-text-main'}`}>{selectedUser.plan || 'free'}</div>
                                    )}
                                </div>
                            </div>

                            {/* Real Database Fields - Premium Cards */}
                            <div className="space-y-4 mt-6">
                                <h4 className="text-[10px] font-bold text-[#FF8B66] uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                                    <span className="material-symbols-outlined text-sm">storage</span>
                                    Database Record
                                </h4>

                                {/* Subscription Status Card - Shows for ALL users */}
                                <div className={`p-5 rounded-2xl border relative overflow-hidden ${selectedUser.plan === 'pro'
                                    ? 'bg-gradient-to-r from-[#FF8B66]/10 via-transparent to-[#FF8B66]/5 border-[#FF8B66]/20'
                                    : 'bg-surface border-border'
                                    }`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-lg ${selectedUser.plan === 'pro' ? 'text-[#FF8B66]' : 'text-text-muted'}`}>
                                                {selectedUser.plan === 'pro' ? 'verified' : 'person'}
                                            </span>
                                            <span className={`text-sm font-bold uppercase tracking-wider ${selectedUser.plan === 'pro' ? 'text-[#FF8B66]' : 'text-text-muted'}`}>
                                                {selectedUser.plan === 'pro' ? 'Pro Subscription' : 'Free Plan'}
                                            </span>
                                        </div>
                                        {/* Plan Active Status */}
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${selectedUser.plan === 'pro'
                                            ? (selectedUser.isPlanActive !== false ? 'bg-[#00FF41]/20 text-[#00FF41]' : 'bg-red-500/20 text-red-400')
                                            : 'bg-background text-text-muted'
                                            }`}>
                                            {selectedUser.plan === 'pro'
                                                ? (selectedUser.isPlanActive !== false ? '● Active' : '● Expired')
                                                : 'No Subscription'
                                            }
                                        </span>
                                    </div>

                                    {selectedUser.plan === 'pro' ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-background p-3 rounded-xl border border-border">
                                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">Billing Cycle</span>
                                                <span className="text-base font-bold text-text-main uppercase">{selectedUser.planInterval || 'Monthly'}</span>
                                            </div>
                                            <div className="bg-background p-3 rounded-xl border border-border">
                                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">Expires On</span>
                                                <span className="text-sm font-bold text-text-main">{selectedUser.planExpiresAt ? new Date(selectedUser.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'Never'}</span>
                                            </div>
                                            <div className="bg-background p-3 rounded-xl border border-border">
                                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">Days Left</span>
                                                <span className={`text-lg font-mono font-bold ${selectedUser.planExpiresAt
                                                    ? (Math.ceil((new Date(selectedUser.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) > 7 ? 'text-[#00FF41]' : 'text-red-400')
                                                    : 'text-text-muted'
                                                    }`}>
                                                    {selectedUser.planExpiresAt
                                                        ? Math.max(0, Math.ceil((new Date(selectedUser.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                                                        : '∞'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2">
                                            <span className="text-text-muted text-xs">No Pro subscription purchased</span>
                                        </div>
                                    )}
                                </div>

                                {/* Activity Stats - Enhanced */}
                                <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-text-muted text-lg">timeline</span>
                                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Activity & Usage</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background p-4 rounded-xl border border-border/50">
                                            <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">Generations Today</span>
                                            <span className="text-2xl font-mono font-bold text-[#00FF41]">{selectedUser.generationsTodayCount ?? 0}</span>
                                        </div>
                                        <div className="bg-background p-4 rounded-xl border border-border/50">
                                            <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">Last Generation</span>
                                            <span className="text-sm font-bold text-text-main">{selectedUser.lastGenerationDate || 'Never'}</span>
                                        </div>
                                        <div className="bg-background p-4 rounded-xl border border-border/50">
                                            <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">Account Created</span>
                                            <span className="text-sm font-bold text-text-main">{selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}</span>
                                        </div>
                                        <div className="bg-background p-4 rounded-xl border border-border/50">
                                            <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">Last Login</span>
                                            <span className="text-sm font-bold text-text-main">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* User Role */}
                                <div className="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedUser.role === 'admin' ? 'bg-red-500/20' : 'bg-background'}`}>
                                            <span className={`material-symbols-outlined ${selectedUser.role === 'admin' ? 'text-red-400' : 'text-text-muted'}`}>
                                                {selectedUser.role === 'admin' ? 'admin_panel_settings' : 'person'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">User Role</span>
                                            <span className={`text-sm font-bold uppercase ${selectedUser.role === 'admin' ? 'text-red-400' : 'text-text-main'}`}>{selectedUser.role || 'User'}</span>
                                        </div>
                                    </div>
                                    {selectedUser.role === 'admin' && (
                                        <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-[9px] font-bold text-red-400 uppercase">Admin Access</span>
                                    )}
                                </div>

                                {/* User ID Card */}
                                <div className="bg-background p-4 rounded-2xl border border-border shadow-inner">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">User ID (Firebase UID)</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(selectedUser.id)}
                                            className="text-[9px] font-bold text-[#FF8B66] uppercase tracking-wider hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xs">content_copy</span>
                                            Copy
                                        </button>
                                    </div>
                                    <code className="text-[11px] font-mono text-text-main break-all select-all bg-surface p-2 rounded-lg block border border-border">{selectedUser.id}</code>
                                </div>

                                {/* Email Card */}
                                <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border">
                                        <span className="material-symbols-outlined text-text-muted">mail</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block mb-1">Email Address</span>
                                        <span className="text-sm font-mono text-text-main truncate block">{selectedUser.email}</span>
                                    </div>
                                </div>

                                {/* Join Date Card */}
                                <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border">
                                        <span className="material-symbols-outlined text-text-muted">calendar_today</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block mb-1">Account Created</span>
                                        <span className="text-sm font-bold text-text-main">{selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-6 border-t border-border mt-6">
                                <button onClick={() => handleResetCredits(selectedUser.id)} className="w-full py-4 rounded-2xl bg-surface border border-border text-xs font-bold text-text-main uppercase tracking-wider hover:bg-border transition-all flex items-center justify-center gap-3">
                                    <span className="material-symbols-outlined text-lg">refresh</span>
                                    Reset Credits to 10
                                </button>
                                <button onClick={() => handleDeleteUser(selectedUser.id)} className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 uppercase tracking-wider hover:bg-red-500/20 transition-all flex items-center justify-center gap-3">
                                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                                    Delete User Permanently
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )
                }
            </AnimatePresence >

            <Toast
                message={toast?.message || ''}
                type={toast?.type}
                isOpen={!!toast}
                onClose={() => setToast(null)}
            />

            <ConfirmDialog
                isOpen={!!confirmDialog?.isOpen}
                title={confirmDialog?.title || ''}
                message={confirmDialog?.message || ''}
                onConfirm={confirmDialog?.onConfirm || (() => { })}
                onCancel={() => setConfirmDialog(null)}
                confirmText="Delete Permanently"
                type="danger"
            />
        </div >
    );
};

export default Admin;
