import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImpactStyle } from '@capacitor/haptics';
import { auth, signInWithGoogle } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { haptics } from '../services/hapticsService';

interface Props {
  type: 'login' | 'register';
  onAuthSuccess: () => void;
  onSwitch: () => void;
}

const AuthPage: React.FC<Props> = ({ type, onAuthSuccess, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (type === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (!err.message?.includes('cancel') && err.error !== 'user_cancelled') {
        setError(`Login Error: ${err.message || 'Unknown Error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-text-main flex flex-col font-sans select-none overflow-hidden h-[100dvh] w-full max-w-md mx-auto left-0 right-0 top-0 bottom-0 shadow-2xl">
      {/* Background Polish */}
      <div className="noise opacity-[0.03]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,139,102,0.08)_0%,transparent_70%)]" />

      {/* Header Area */}
      <header className="pt-16 px-10 flex flex-col items-center text-center z-10 shrink-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 bg-surface rounded-[2rem] shadow-xl flex items-center justify-center border border-border mb-8"
        >
          <img src="/logo.png" alt="Namelime" className="w-10 h-10 object-contain" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF8B66] mb-4 block">
              {type === 'login' ? 'IDENTITY SECURED' : 'ACADEMY ENTRANCE'}
            </span>
            <h1 className="text-[3.5rem] font-black leading-[0.8] tracking-tighter mb-4 text-text-main dark:text-gradient-premium">
              {type === 'login' ? 'Welcome' : 'Studio'}
            </h1>
            <p className="text-text-muted text-[14px] font-bold uppercase tracking-widest">
              {type === 'login' ? 'Proceed to Workspace' : 'Initialize Account'}
            </p>
          </motion.div>
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-10 pt-12 pb-12 z-10">
        <form className="space-y-4" onSubmit={handleAuth}>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 rounded-2xl border border-red-100 mb-6"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 text-center">{error}</p>
            </motion.div>
          )}

          <div className="space-y-3">
            {type === 'register' && (
              <div className="bg-surface rounded-[1.8rem] border border-border p-2 px-6 shadow-sm focus-within:border-[#FF8B66]/30 focus-within:ring-4 focus-within:ring-[#FF8B66]/5 transition-all">
                <span className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest block pt-2 px-1">Full Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full h-10 bg-transparent border-none focus:ring-0 text-[14px] font-black tracking-tight text-text-main placeholder:text-text-muted/20"
                />
              </div>
            )}

            <div className="bg-surface rounded-[1.8rem] border border-border p-2 px-6 shadow-sm focus-within:border-[#FF8B66]/30 focus-within:ring-4 focus-within:ring-[#FF8B66]/5 transition-all">
              <span className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest block pt-2 px-1">Email Terminal</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full h-10 bg-transparent border-none focus:ring-0 text-[14px] font-black tracking-tight text-text-main placeholder:text-text-muted/20"
              />
            </div>

            <div className="bg-surface rounded-[1.8rem] border border-border p-2 px-6 shadow-sm focus-within:border-[#FF8B66]/30 focus-within:ring-4 focus-within:ring-[#FF8B66]/5 transition-all">
              <span className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest block pt-2 px-1">Security Key</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 bg-transparent border-none focus:ring-0 text-[14px] font-black tracking-tight text-text-main placeholder:text-text-muted/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={() => haptics.impact(ImpactStyle.Heavy)}
            className="w-full h-20 bg-text-main text-background rounded-[2.2rem] flex items-center justify-between px-10 font-black text-[14px] uppercase tracking-[0.3em] shadow-xl hover:bg-[#FF8B66] transition-all active:scale-[0.98] mt-8 disabled:opacity-50"
          >
            <span>{loading ? 'Wait...' : (type === 'login' ? 'Authorize' : 'Initialize')}</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
            </div>
          </button>
        </form>

        <div className="flex items-center gap-6 py-10 opacity-20">
          <div className="h-[2px] bg-text-muted/20 flex-1 rounded-full"></div>
          <span className="text-[10px] font-black tracking-[0.5em] text-text-muted">OR</span>
          <div className="h-[2px] bg-text-muted/20 flex-1 rounded-full"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full h-20 bg-surface border border-border rounded-[2.2rem] flex items-center justify-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-text-muted">Continue with Google</span>
        </button>

        <div className="mt-12 text-center pb-8">
          <button
            onClick={() => {
              haptics.selectionChanged();
              onSwitch();
            }}
            className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-text-main transition-colors"
          >
            {type === 'login' ? "New to the Studio?" : "Existing Founder?"} <span className="text-text-main underline decoration-text-muted/30 underline-offset-8 ml-2">{type === 'login' ? 'IDENTITY' : 'AUTHORIZE'}</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;