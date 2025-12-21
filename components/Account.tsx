import React from 'react';
import { User } from '../types';

interface Props {
    user: User;
    onBack: () => void;
    onLogout: () => void;
    onUpgrade: () => void;
}

const Account: React.FC<Props> = ({ user, onBack, onLogout, onUpgrade }) => {
    if (!user) return null;
    const isPro = user.plan === 'pro';

    return (
        <div className="min-h-full relative bg-transparent font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 pt-[calc(env(safe-area-inset-top)+1.0rem)] bg-background/90 backdrop-blur-md border-b border-border">
                <button onClick={onBack} className="text-lg flex items-center">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="font-bold text-lg text-text-main">Account</h2>
                <button onClick={onBack} className="font-bold text-text-muted hover:text-text-main transition-colors">Done</button>
            </div>

            <div className="px-5 pb-8">
                <div className="flex flex-col items-center py-8">
                    <div className="w-24 h-24 rounded-full border-4 border-surface shadow-md relative mb-4">
                        <img
                            src={user.avatarUrl}
                            referrerPolicy="no-referrer"
                            alt="User"
                            className="w-full h-full rounded-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-primary rounded-full border-2 border-surface"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-text-main">{user.name}</h2>
                    <p className="text-text-muted font-medium">{user.email}</p>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Plan Card */}
                    <div className={`relative rounded-xl p-6 overflow-hidden ${isPro ? 'bg-[#18181b] text-white border border-primary/20 shadow-premium-dark' : 'bg-surface border border-border text-text-main'}`}>
                        {/* Abstract bg for card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-80">
                                <span className="material-symbols-outlined text-sm">diamond</span>
                                <span className="text-xs font-bold uppercase tracking-wider">Current Plan</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{isPro ? 'Pro Member' : 'Starter (Free)'}</h3>
                            <p className="text-sm opacity-80 mb-4">
                                {isPro
                                    ? (user.planExpiresAt
                                        ? `Plan active until ${new Date(user.planExpiresAt).toLocaleDateString()}`
                                        : 'You have full access to everything.')
                                    : 'Unlock unlimited AI generations.'}
                            </p>

                            {!isPro && (
                                <button onClick={onUpgrade} className="w-full h-12 bg-primary text-black rounded-full font-bold flex justify-between items-center px-6">
                                    <span>Upgrade to Pro</span>
                                    <span className="text-xs bg-black/10 px-2 py-1 rounded">$12/mo</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Credits */}
                    <div>
                        <h3 className="font-bold text-lg mb-3 text-text-main">Monthly Credits</h3>
                        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <span className="text-3xl font-bold">{user.credits}</span>
                                    <span className="text-text-muted font-bold text-lg">/{isPro ? '∞' : '10'}</span>
                                    <p className="text-xs text-text-muted/50 uppercase font-bold mt-1">Generations Used</p>
                                </div>
                                <div className="flex items-center gap-1 bg-primary/20 px-3 py-1 rounded-full text-xs font-bold text-yellow-700 dark:text-primary">
                                    <span className="material-symbols-outlined text-xs">timer</span>
                                    Resets in 4 days
                                </div>
                            </div>
                            <div className="w-full h-3 bg-background rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[30%] shadow-[0_0_10px_rgba(255,139,102,0.4)]"></div>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg text-text-main">Billing History</h3>
                            <button className="text-xs font-bold text-text-muted">See All</button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-text-muted">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-text-main">Mar 01, 2024</p>
                                        <p className="text-xs text-text-muted">Invoice #1023</p>
                                    </div>
                                </div>
                                <div className="font-bold text-sm text-text-main">$0.00</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full h-16 rounded-[2rem] bg-red-500/5 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-4"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Account;