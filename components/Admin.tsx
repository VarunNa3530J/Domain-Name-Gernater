import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface Props {
    currentUser: User;
    onBack: () => void;
}

// Console Log Capture
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

    // PIN Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    // Fetch Users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Determine collection based on Firestore structure (assuming 'users')
                const querySnapshot = await getDocs(collection(db, 'users'));
                const usersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Flatten key dates
                    joinedAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
                }));
                setUsers(usersList);
            } catch (err) {
                console.error("Admin Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const handlePinSubmit = (value: string) => {
        if (value.length < 4) {
            setPin(prev => prev + value);
            const newPin = pin + value;
            if (newPin.length === 4) {
                if (newPin === '2024') { // Hardcoded PIN
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
                className="fixed inset-0 bg-background/95 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center p-6 text-center font-sans select-none"
            >
                <div className="absolute inset-0 interactive-grid opacity-[0.03] pointer-events-none"></div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="relative mb-12"
                >
                    <div className="w-24 h-24 rounded-full bg-surface/50 border border-border/50 shadow-2xl flex items-center justify-center relative overflow-hidden backdrop-blur-md">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF8B66]/20 to-transparent opacity-50"></div>
                        <span className="material-symbols-outlined text-4xl text-[#FF8B66]">lock</span>
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-text-main text-sm font-medium tracking-[0.3em] uppercase mb-12 opacity-80"
                >
                    Security Clearance
                </motion.h2>

                {/* PIN Dots */}
                <div className={`flex gap-6 mb-16 transition-transform duration-100 ${error ? 'translate-x-[-10px]' : ''}`}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border border-text-main/20 transition-all duration-300 ${pin.length > i
                            ? 'bg-text-main scale-110 shadow-lg'
                            : 'bg-transparent scale-100'
                            }`}></div>
                    ))}
                </div>

                {/* Circular Keypad */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[320px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, i) => (
                        <motion.button
                            key={num}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + (i * 0.05) }}
                            onClick={() => handlePinSubmit(num.toString())}
                            className="w-20 h-20 rounded-full border border-text-main/10 text-3xl font-light text-text-main hover:bg-text-main/5 active:bg-text-main/10 active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm"
                        >
                            {num}
                        </motion.button>
                    ))}
                    <div className="w-20 h-20"></div> {/* Spacer */}
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        onClick={() => handlePinSubmit('0')}
                        className="w-20 h-20 rounded-full border border-text-main/10 text-3xl font-light text-text-main hover:bg-text-main/5 active:bg-text-main/10 active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm"
                    >
                        0
                    </motion.button>
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        onClick={handleBackspace}
                        className="w-20 h-20 rounded-full flex items-center justify-center text-text-main/50 hover:text-text-main active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-3xl">backspace</span>
                    </motion.button>
                </div>

                <button
                    onClick={onBack}
                    className="mt-16 text-xs font-bold text-text-muted/50 uppercase tracking-widest hover:text-text-main transition-colors"
                >
                    Cancel Access
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
            alert("User updated successfully!");
        } catch (e) {
            console.error("Update failed", e);
            alert("Failed to update user");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("CRITICAL: Permanent data deletion initiated. Proceed?")) return;
        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(prev => prev.filter(u => u.id !== userId));
            setSelectedUser(null);
            alert("Entity purged from database.");
        } catch (err) {
            console.error("Deletion failed:", err);
            alert("Deletion protocol failed.");
        }
    };

    const handleResetCredits = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), { credits: 10, generationsTodayCount: 0 });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: 10, generationsTodayCount: 0 } : u));
            alert("Credits re-initialized to baseline.");
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
        <div className="h-full bg-background overflow-hidden flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 px-5 py-4 pt-[calc(env(safe-area-inset-top)+1.0rem)] flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-text-muted"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-text-main">Admin Command</h1>
                <div className="w-10" />
            </header>

            {/* Tabs & Search */}
            <div className="p-4 bg-surface border-b border-border space-y-4">
                <div className="flex gap-2">
                    {(['users', 'analytics', 'console'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-[#FF8B66] text-white shadow-lg shadow-[#FF8B66]/20'
                                : 'bg-background text-text-muted border border-border hover:text-text-main'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'users' && (
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name, email, or ID..."
                            className="w-full h-11 bg-background border border-border rounded-xl pl-10 pr-4 text-sm text-text-main focus:border-[#FF8B66]/80 transition-colors placeholder:text-text-main/40 font-medium"
                        />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'users' ? (
                    <div className="space-y-4">
                        {loading && <div className="text-center p-8 opacity-50">Scanning Database...</div>}

                        {!loading && filteredUsers.map(u => (
                            <motion.div
                                key={u.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => !editingUser && setSelectedUser(u)}
                                className={`bg-surface p-5 rounded-[1.5rem] border border-border shadow-sm transition-all ${!editingUser ? 'hover:border-[#FF8B66]/30 active:scale-[0.98] cursor-pointer' : ''}`}
                            >
                                {/* User Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center font-bold text-sm overflow-hidden text-text-main shadow-inner">
                                            {u.avatarUrl ? <img src={u.avatarUrl} alt="User avatar" className="w-full h-full object-cover" /> : (u.name?.[0] || u.email?.[0] || 'U')?.toUpperCase()}
                                        </div>
                                        <div>
                                            {editingUser === u.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder="Name"
                                                    aria-label="Edit Name"
                                                    className="font-black text-text-main text-base bg-background border border-border rounded px-2 w-full mb-1"
                                                />
                                            ) : (
                                                <h3 className="font-black text-text-main text-base break-words max-w-[180px]">{u.name || 'No Name'}</h3>
                                            )}
                                            <p className="text-[11px] text-text-muted font-medium break-all max-w-[180px]">{u.email}</p>
                                        </div>
                                    </div>
                                    {editingUser === u.id ? (
                                        <select
                                            value={editPlan}
                                            onChange={(e) => setEditPlan(e.target.value as 'free' | 'pro')}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label="Select Plan"
                                            className="text-[9px] font-black px-2 py-1 rounded-lg uppercase bg-background border border-border text-text-main"
                                        >
                                            <option value="free">FREE</option>
                                            <option value="pro">PRO</option>
                                        </select>
                                    ) : (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${u.plan === 'pro' ? 'bg-[#FF8B66] text-white shadow-[0_4px_12px_-2px_rgba(255,139,102,0.3)]' : 'bg-background border border-border text-text-muted'
                                                }`}>
                                                {u.plan === 'pro' ? 'PRO' : 'FREE'}
                                            </span>
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                                DETAILS <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-background border border-border p-3 rounded-xl shadow-inner">
                                        <span className="text-[10px] font-black uppercase text-text-muted block mb-1 tracking-widest">Credits</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-text-main">{u.credits ?? 0}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.credits > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        </div>
                                    </div>
                                    <div className="bg-background border border-border p-3 rounded-xl shadow-inner">
                                        <span className="text-[10px] font-black uppercase text-text-muted block mb-1 tracking-widest">Today</span>
                                        <span className="text-lg font-black text-text-main">{u.generationsTodayCount ?? 0}</span>
                                    </div>
                                </div>

                                {/* Action Bar (Edit only shows here when not expanded) */}
                                {editingUser === u.id && (
                                    <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-text-muted font-bold break-all">ID: {u.id}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingUser(null); }}
                                                className="text-[10px] font-black text-text-muted hover:text-text-main uppercase"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSaveUser(u.id); }}
                                                className="text-[10px] font-black text-[#FF8B66] hover:opacity-80 uppercase"
                                            >
                                                Save All
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : activeTab === 'analytics' ? (
                    <div className="space-y-6">
                        {/* Global System HUD */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-surface p-6 rounded-[2.5rem] border border-border relative overflow-hidden group shadow-sm"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl rounded-full"></div>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Total Core Entities</span>
                                <div className="text-4xl font-black text-text-main tracking-tighter">{users.length}</div>
                                <div className="mt-2 text-[9px] font-bold text-green-500 uppercase flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">trending_up</span> SYSTEM_STABLE
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-surface p-6 rounded-[2.5rem] border border-border relative overflow-hidden group shadow-sm"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF8B66]/5 blur-3xl rounded-full"></div>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block mb-2">Active Architect Tier</span>
                                <div className="text-4xl font-black text-[#FF8B66] tracking-tighter">{users.filter(u => u.plan === 'pro').length}</div>
                                <div className="mt-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">PRO_SUBSCRIPTION_LOAD</div>
                            </motion.div>
                        </div>

                        {/* Usage Metrics */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-surface p-8 rounded-[2.8rem] border border-border space-y-6 shadow-sm"
                        >
                            <h3 className="text-xs font-black text-text-main uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8B66] animate-pulse"></span>
                                Live Resource Distribution
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Credits in Circulation</span>
                                    <span className="text-xl font-black text-text-main">{users.reduce((acc, u) => acc + (u.credits || 0), 0)}</span>
                                </div>
                                <div className="w-full bg-background h-1.5 rounded-full overflow-hidden border border-border/5">
                                    <div className="bg-[#FF8B66] h-full" style={{ width: '65%' }}></div>
                                </div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Generations Today (Global)</span>
                                    <span className="text-xl font-black text-text-main">{users.reduce((acc, u) => acc + (u.generationsTodayCount || 0), 0)}</span>
                                </div>
                                <div className="w-full bg-background h-1.5 rounded-full overflow-hidden border border-border/5">
                                    <div className="bg-text-main h-full" style={{ width: '30%' }}></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Health Matrix */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-surface/30 p-8 rounded-[2.8rem] border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4"
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                <span className="material-symbols-outlined text-text-muted/20 text-3xl animate-spin-slow">settings_heart</span>
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest">Engine Integrity: 100%</h4>
                                <p className="text-[9px] text-text-muted font-bold uppercase tracking-tighter mt-1">All startup naming nodes operating within nominal parameters.</p>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="bg-[#050505] text-[#00FF41] p-6 rounded-[2rem] font-mono text-[10px] h-full overflow-y-auto border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] leading-relaxed">
                        <div className="mb-4 text-[#00FF41]/60 uppercase tracking-[0.3em] font-black border-b border-white/10 pb-2">System Diagnostic Console</div>
                        {consoleLogs.length === 0 && <div className="opacity-30 animate-pulse">Waiting for telemetry...</div>}
                        {consoleLogs.map((log, i) => (
                            <div key={i} className="mb-2 border-l-2 border-[#00FF41]/30 pl-3 break-all">
                                <span className="text-[#00FF41]/40 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User Deep-Dive Overlay */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] bg-background flex flex-col pt-safe"
                    >
                        {/* Detail Header */}
                        <header className="p-6 pt-12 flex items-center justify-between border-b border-border bg-surface/[0.95] backdrop-blur-xl sticky top-0 z-20">
                            <button
                                onClick={() => { setSelectedUser(null); setEditingUser(null); }}
                                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h2 className="text-lg font-black text-text-main uppercase tracking-[0.2em]">Intel Core</h2>
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
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${editingUser === selectedUser.id
                                    ? 'bg-[#FF8B66] text-white shadow-lg'
                                    : 'bg-surface border border-border text-text-main shadow-sm active:scale-95 hover:border-[#FF8B66]/40'
                                    }`}
                            >
                                {editingUser === selectedUser.id ? 'Save Changes' : 'Override Permissions'}
                            </button>
                        </header>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth pb-32">
                            {/* Profile Monolith */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-[#FF8B66]/10 blur-2xl rounded-full opacity-50 animate-pulse-slow"></div>
                                    <div className="w-32 h-32 rounded-[2.8rem] bg-surface border-2 border-border p-1 relative z-10 shadow-2xl overflow-hidden group">
                                        {selectedUser.avatarUrl ? (
                                            <img src={selectedUser.avatarUrl} alt="User avatar" className="w-full h-full object-cover rounded-[2.5rem] transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[40px] font-black text-[#FF8B66]">
                                                {selectedUser.name?.[0] || selectedUser.email?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-2 -right-2 ${selectedUser.plan === 'pro' ? 'bg-[#FF8B66]' : 'bg-text-muted'} text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20 uppercase tracking-[0.1em]`}>
                                        {selectedUser.plan}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    {editingUser === selectedUser.id ? (
                                        <input
                                            type="text"
                                            aria-label="Edit Name"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="text-3xl font-black text-text-main bg-background border-b-2 border-[#FF8B66] px-4 py-2 text-center outline-none"
                                        />
                                    ) : (
                                        <h3 className="text-3xl font-black text-text-main tracking-tighter leading-tight drop-shadow-sm">{selectedUser.name || 'Anonymous User'}</h3>
                                    )}
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-[#FF8B66]">mail</span>
                                        <p className="text-text-muted font-black tracking-widest uppercase text-[11px]">{selectedUser.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Stats Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface p-5 rounded-[2.2rem] border border-border group transition-all hover:border-[#FF8B66]/20">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">Credits</span>
                                        <span className="material-symbols-outlined text-[18px] text-[#FF8B66]">token</span>
                                    </div>
                                    {editingUser === selectedUser.id ? (
                                        <input
                                            type="number"
                                            aria-label="Edit Credits"
                                            value={editCredits}
                                            onChange={(e) => setEditCredits(e.target.value)}
                                            className="text-2xl font-black text-text-main bg-background border border-border rounded-lg px-3 w-full"
                                        />
                                    ) : (
                                        <div className="text-4xl font-black text-text-main tracking-tighter">{selectedUser.credits}</div>
                                    )}
                                </div>
                                <div className="bg-surface p-5 rounded-[2.2rem] border border-border group transition-all hover:border-[#FF8B66]/20">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">Engines Run</span>
                                        <span className="material-symbols-outlined text-[18px] text-[#FF8B66]">bolt</span>
                                    </div>
                                    {editingUser === selectedUser.id ? (
                                        <input
                                            type="number"
                                            aria-label="Edit Generations Today"
                                            value={editGenerationsToday}
                                            onChange={(e) => setEditGenerationsToday(e.target.value)}
                                            className="text-2xl font-black text-text-main bg-background border border-border rounded-lg px-3 w-full"
                                        />
                                    ) : (
                                        <div className="text-4xl font-black text-text-main tracking-tighter">{selectedUser.generationsTodayCount}</div>
                                    )}
                                </div>
                            </div>

                            {/* Plan Logistics Monolith */}
                            <div className="bg-surface p-7 rounded-[2.8rem] border border-border space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8B66]/5 blur-3xl rounded-full"></div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#FF8B66] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#FF8B66]"></span>
                                    Subscription Core
                                </h4>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center bg-background p-5 rounded-[1.8rem] border border-border shadow-inner">
                                        <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">Status</span>
                                        {editingUser === selectedUser.id ? (
                                            <select
                                                value={editPlan}
                                                aria-label="Select Plan"
                                                onChange={(e) => setEditPlan(e.target.value as 'free' | 'pro')}
                                                className="bg-surface text-text-main font-black px-4 py-2 rounded-xl border border-border text-xs focus:ring-2 ring-[#FF8B66]/20 outline-none"
                                            >
                                                <option value="free">FREE TIER</option>
                                                <option value="pro">PRO ARCHITECT</option>
                                            </select>
                                        ) : (
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${selectedUser.plan === 'pro' ? 'text-[#FF8B66] bg-[#FF8B66]/10 shadow-[inner_0_0_10px_rgba(255,139,102,0.1)]' : 'text-text-muted bg-border shadow-sm'}`}>
                                                {selectedUser.plan}
                                            </span>
                                        )}
                                    </div>

                                    {(selectedUser.plan === 'pro' || (editingUser === selectedUser.id && editPlan === 'pro')) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex justify-between items-center bg-background p-5 rounded-[1.8rem] border border-border shadow-inner">
                                                <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">Cycle</span>
                                                {editingUser === selectedUser.id ? (
                                                    <select
                                                        value={editPlanInterval}
                                                        aria-label="Select Plan Interval"
                                                        onChange={(e) => setEditPlanInterval(e.target.value as 'monthly' | 'yearly')}
                                                        className="bg-surface text-text-main font-black px-4 py-2 rounded-xl border border-border text-xs outline-none"
                                                    >
                                                        <option value="monthly">MONTHLY</option>
                                                        <option value="yearly">ANNUAL</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-[11px] font-black text-[#FF8B66] uppercase tracking-widest">{selectedUser.planInterval}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center bg-background p-5 rounded-[1.8rem] border border-border shadow-inner">
                                                <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">Expires</span>
                                                {editingUser === selectedUser.id ? (
                                                    <input
                                                        type="date"
                                                        aria-label="Edit Expiry Date"
                                                        value={editPlanExpiresAt}
                                                        onChange={(e) => setEditPlanExpiresAt(e.target.value)}
                                                        className="bg-surface text-text-main font-black px-4 py-2 rounded-xl border border-border text-xs outline-none"
                                                    />
                                                ) : (
                                                    <span className="text-[11px] font-black text-text-main uppercase tracking-widest">
                                                        {selectedUser.planExpiresAt ? new Date(selectedUser.planExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'NEVER'}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Telemetry Block */}
                            <div className="bg-surface p-8 rounded-[2.8rem] border border-dashed border-border space-y-5 shadow-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF8B66] text-center">System Telemetry</h4>
                                <div className="space-y-4 text-[11px] font-mono">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-muted/60 uppercase tracking-tighter font-black">Genesis Date</span>
                                        <span className="text-text-main font-black">{selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString() : 'LEGACY'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-muted/60 uppercase tracking-tighter font-black">Last Active</span>
                                        <span className="text-text-main font-black truncate max-w-[150px]">{selectedUser.lastGenerationDate || 'COLD_SLEEP'}</span>
                                    </div>
                                    <div className="pt-4 border-t border-border flex flex-col gap-2">
                                        <span className="text-text-muted font-black text-[10px] uppercase tracking-[0.2em]">Hardware Address</span>
                                        <span className="text-text-main font-bold text-[11px] break-all leading-relaxed bg-background p-3 rounded-xl border border-border shadow-inner">
                                            {selectedUser.id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Moderation Toolkit */}
                            <div className="pt-8 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/50 text-center">Danger Zone / Administration</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleResetCredits(selectedUser.id)}
                                        className="h-12 rounded-2xl bg-surface border border-border text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-background transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">refresh</span> Reset Credits
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(selectedUser.id)}
                                        className="h-12 rounded-2xl bg-red-500/5 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete_forever</span> Purge Entity
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
