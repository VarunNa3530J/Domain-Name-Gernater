import React from 'react';

interface Props {
    onGetStarted: () => void;
    onLogin: () => void;
}

const LandingPage: React.FC<Props> = ({ onGetStarted, onLogin }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-black animate-fade-in-up">
            {/* Sticky Nav */}
            <nav className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-black/80 backdrop-blur-xl px-6 py-4 justify-between border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-black text-lg rotate-0">T</div>
                    <h2 className="text-xl font-bold tracking-tight">Tofu</h2>
                </div>
                <button onClick={onLogin} className="text-sm font-bold text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">
                    Log In
                </button>
            </nav>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                {/* Hero */}
                <header className="px-6 pt-16 pb-12 text-center flex flex-col items-center gap-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-black/5 dark:border-white/10 shadow-sm animate-scale-in" style={{ animationDelay: '0.1s' }}>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-6 h-6 rounded-full border-2 border-white dark:border-surface-dark" alt="User" />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Used by 10,000+ creators</span>
                    </div>

                    <h1 className="text-6xl font-black leading-[0.9] tracking-tighter text-black dark:text-white animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Kill the <br />
                        <span className="text-gray-200 dark:text-gray-800">Boring</span> <br />
                        Name.
                    </h1>

                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xs mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        Most AI name generators give you "Tofu"—bland, generic, forgettable. We build brands.
                    </p>

                    <div className="w-full relative group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        {/* Decorative Elements */}
                        <div className="absolute top-10 -right-4 w-24 h-24 bg-primary rounded-full blur-[40px] opacity-60"></div>
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20"></div>

                        {/* Main Card */}
                        <div className="relative bg-white dark:bg-surface-dark rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.02]">
                            <div className="flex items-center justify-between mb-8 opacity-50">
                                <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                <div className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
                            </div>

                            <div className="space-y-4">
                                {/* Simulating generation */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-400">hourglass_empty</span>
                                    </div>
                                    <div className="h-4 w-32 bg-gray-100 dark:bg-white/10 rounded animate-pulse"></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-black">
                                        <span className="material-symbols-outlined text-black font-bold">check</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Perplexity.ai</h3>
                                        <p className="text-xs font-bold text-gray-400">Descriptive • Premium</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Comparison */}
                <section className="px-6 py-12 flex flex-col gap-6">
                    <h2 className="text-3xl font-black tracking-tight text-center mb-4">Don't be vanilla.</h2>

                    <div className="grid gap-4">
                        <div className="p-6 rounded-3xl bg-gray-100 dark:bg-white/5 border border-transparent flex gap-4 items-center opacity-70">
                            <span className="material-symbols-outlined text-gray-400 text-3xl">sentiment_dissatisfied</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-500 line-through">SmartTechify</h3>
                                <p className="text-xs text-gray-400">Forgettable 90s name.</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-black dark:bg-white text-white dark:text-black shadow-xl transform scale-105 border-2 border-primary relative z-10">
                            <div className="absolute -top-3 right-6 bg-primary text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-black">The Tofu Way</div>
                            <div className="flex gap-4 items-center">
                                <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
                                <div>
                                    <h3 className="font-black text-2xl">Cognition</h3>
                                    <p className="text-sm text-gray-400 dark:text-gray-600 font-bold">Short. Deep. Iconic.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Mini */}
                <section className="px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Fair Pricing</h2>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Save 20% Yearly</span>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Simplified pricing view for landing */}
                        <div className="p-1 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-surface-dark dark:to-black">
                            <div className="bg-white dark:bg-black p-6 rounded-[20px] h-full flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-lg">Free</h3>
                                    <p className="text-sm text-gray-500">For daydreamers.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black">$0</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-1 rounded-3xl bg-gradient-to-br from-primary to-yellow-400">
                            <div className="bg-white dark:bg-black p-6 rounded-[20px] h-full flex items-center justify-between relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                                <div className="relative z-10">
                                    <h3 className="font-black text-lg">Pro</h3>
                                    <p className="text-sm text-gray-500">For builders.</p>
                                </div>
                                <div className="text-right relative z-10">
                                    <p className="text-2xl font-black">$12</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Sticky CTA */}
            <div className="absolute bottom-0 left-0 w-full p-6 pt-24 bg-gradient-to-t from-white dark:from-black via-white dark:via-black to-transparent z-40">
                <button onClick={onGetStarted} className="group w-full h-16 bg-black dark:bg-white text-white dark:text-black text-lg font-bold rounded-full shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95">
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>
                    Generate My Name
                </button>
            </div>
        </div>
    );
};

export default LandingPage;