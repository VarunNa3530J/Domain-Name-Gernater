import React, { useState } from 'react';
import { Page } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../services/hapticsService';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithApple,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  auth
} from '../services/firebase';
import { toast } from 'react-hot-toast';

interface Props {
  type: 'login' | 'register';
  onAuthSuccess: () => void;
  onBack: () => void;
  onNavigate: (page: Page) => void;
}

const DottedBackground: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width: number;
    let height: number;

    const dots: { x: number; y: number; phase: number }[] = [];
    const clusters = [
      { x: 0.2, y: 0.3, color: '#3b82f6', vx: 0.0004, vy: 0.0003 }, // Blue
      { x: 0.8, y: 0.2, color: '#22d3ee', vx: -0.0003, vy: 0.0005 }, // Cyan
      { x: 0.3, y: 0.7, color: '#8b5cf6', vx: 0.0005, vy: -0.0004 }, // Purple
      { x: 0.7, y: 0.8, color: '#f97316', vx: -0.0006, vy: -0.0002 }, // Orange
      { x: 0.5, y: 0.5, color: '#14b8a6', vx: 0.0002, vy: 0.0004 },  // Teal
      { x: 0.1, y: 0.6, color: '#ef4444', vx: 0.0003, vy: -0.0003 }, // Red
    ];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      dots.length = 0;
      const spacing = 18;
      for (let x = -spacing; x < width + spacing; x += spacing) {
        for (let y = -spacing; y < height + spacing; y += spacing) {
          dots.push({ x, y, phase: Math.random() * Math.PI * 2 });
        }
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = (time: number) => {
      // Re-read every frame for sync
      const currentIsDark = document.documentElement.classList.contains('dark');

      ctx.fillStyle = currentIsDark ? '#0b0b0b' : '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      clusters.forEach(c => {
        c.x = (c.x + c.vx + 1) % 1;
        c.y = (c.y + c.vy + 1) % 1;
      });

      dots.forEach(dot => {
        let maxInfluence = 0;
        let activeColor = currentIsDark ? '#1a1a1a' : '#e2e8f0';

        const waveX = Math.sin(time * 0.0004 + dot.y * 0.01) * 3.5;
        const waveY = Math.cos(time * 0.0005 + dot.x * 0.01) * 3.5;
        const drawX = dot.x + waveX;
        const drawY = dot.y + waveY;

        clusters.forEach(c => {
          const dx = drawX - (c.x * width);
          const dy = drawY - (c.y * height);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / (Math.min(width, height) * 0.8));
          if (influence > maxInfluence) {
            maxInfluence = influence;
            activeColor = c.color;
          }
        });

        const breathing = (Math.sin(time * 0.0005 + dot.phase) + 1) / 2;
        let opacity = currentIsDark ? 0.025 + (breathing * 0.015) : 0.08 + (breathing * 0.04);
        let color = currentIsDark ? '#1a1a1a' : '#cbd5e1';

        if (maxInfluence > 0.45) {
          color = activeColor;
          const lightPower = (maxInfluence - 0.45) * 1.2;
          opacity = Math.max(opacity, currentIsDark ? (0.05 + lightPower * 0.25) : (0.15 + lightPower * 0.4));
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const distFromCenter = Math.sqrt((drawX - centerX) ** 2 + (drawY - centerY) ** 2);
        const clearRadius = Math.min(width, height) * 0.7;
        const centerMask = Math.max(0.08, Math.min(1, (distFromCenter - clearRadius / 4) / clearRadius));

        ctx.globalAlpha = opacity * centerMask;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-x-0 -top-2 h-[calc(100%+8px)] z-0 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.008] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </>
  );
};

const AuthPage: React.FC<Props> = ({ type, onAuthSuccess, onBack, onNavigate }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>(type);

  const handleBack = () => {
    haptics.impact(ImpactStyle.Light);
    if (showEmailForm) {
      setShowEmailForm(false);
    } else {
      onBack();
    }
  };

  const handleAuthSuccess = () => {
    haptics.notification(NotificationType.Success);
    onAuthSuccess();
  };

  const handleError = (error: any) => {
    console.error('[AuthPage] Error:', error);
    haptics.notification(NotificationType.Error);
    const message = error.message || 'Authentication failed';
    toast.error(message);
    setIsLoading(false);
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      handleAuthSuccess();
    } catch (e) {
      handleError(e);
    }
  };

  const handleMicrosoft = async () => {
    setIsLoading(true);
    try {
      await signInWithMicrosoft();
      handleAuthSuccess();
    } catch (e) {
      handleError(e);
    }
  };

  const handleApple = async () => {
    setIsLoading(true);
    try {
      await signInWithApple();
      handleAuthSuccess();
    } catch (e) {
      handleError(e);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (authMode === 'register') {
      if (!fullName) {
        toast.error('Please enter your full name');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Note: You might want to update the display name here as well
      }
      handleAuthSuccess();
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-text-main flex flex-col items-center justify-center px-6 py-2 overflow-hidden selection:bg-[#FF8B66]/30 transition-colors duration-500">
      <DottedBackground />

      <AnimatePresence>
        {showEmailForm && (
          <motion.button
            key="back-button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleBack}
            className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] left-6 z-50 w-10 h-10 bg-surface border border-border dark:bg-[#050505] dark:border-white/10 rounded-full flex items-center justify-center text-text-muted hover:text-text-main dark:text-white/50 dark:hover:text-white dark:hover:border-white/20 transition-all active:scale-90 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top Branding Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center mt-12"
      >
        <div className="w-20 h-20 bg-surface dark:bg-[#0a0a0a] rounded-[2rem] border border-border dark:border-white/10 flex items-center justify-center mb-8 shadow-sm dark:shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] to-transparent pointer-events-none" />
          <span className="material-symbols-outlined text-4xl text-text-main dark:text-white group-hover:scale-110 transition-transform duration-500">pinch</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-center font-medium tracking-[-0.04em] mb-2 px-4 py-4 leading-tight">
          {showEmailForm ? (authMode === 'login' ? 'Welcome Back' : 'Register Now') : 'Welcome to NameLime'}
        </h1>
        <p className="hidden"></p>
      </motion.div>

      {/* Main Content Area (Toggled between Social and Email) */}
      <div className="relative z-10 w-full max-w-sm flex flex-col">
        <AnimatePresence mode="wait">
          {!showEmailForm ? (
            <motion.div
              key="social-list"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="space-y-4 mb-8"
            >
              <AuthButton
                icon={<GoogleIcon />}
                label="Continue with Google"
                onClick={handleGoogle}
                disabled={isLoading}
              />
              <AuthButton
                icon={<MicrosoftIcon />}
                label="Continue with Microsoft"
                onClick={handleMicrosoft}
                disabled={isLoading}
              />
              <AuthButton
                icon={<AppleIcon />}
                label="Continue with Apple"
                onClick={handleApple}
                disabled={isLoading}
              />

              <div className="flex items-center gap-6 py-6">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border dark:via-white/10 to-transparent" />
                <span className="text-[10px] font-bold text-text-muted dark:text-white/50 uppercase tracking-[0.4em]">or</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border dark:via-white/10 to-transparent" />
              </div>

              <AuthButton
                icon={<span className="material-symbols-outlined text-xl">mail</span>}
                label="Continue with Email"
                onClick={() => {
                  haptics.impact(ImpactStyle.Light);
                  setShowEmailForm(true);
                }}
              />
            </motion.div>
          ) : (
            <motion.form
              key="email-form"
              onSubmit={handleEmailSubmit}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              className="space-y-6 mb-8"
            >
              <div className="space-y-4">
                {authMode === 'register' && (
                  <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted/60 dark:text-white/40 group-focus-within:text-[#FF8B66] transition-colors">
                      <span className="material-symbols-outlined text-xl">person</span>
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full h-16 bg-surface border border-border dark:bg-[#090909] dark:border-white/[0.06] focus:border-text-main/20 dark:focus:border-white/20 rounded-xl pl-14 pr-6 outline-none text-[15px] transition-all placeholder:text-text-muted/30 dark:placeholder:text-white/20"
                      required
                    />
                  </motion.div>
                )}
                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted/60 dark:text-white/40 group-focus-within:text-[#FF8B66] transition-colors">
                    <span className="material-symbols-outlined text-xl">alternate_email</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full h-16 bg-surface border border-border dark:bg-[#090909] dark:border-white/[0.06] focus:border-text-main/20 dark:focus:border-white/20 rounded-xl pl-14 pr-6 outline-none text-[15px] transition-all placeholder:text-text-muted/30 dark:placeholder:text-white/20"
                    required
                  />
                </motion.div>
                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted/60 dark:text-white/40 group-focus-within:text-[#FF8B66] transition-colors">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-16 bg-surface border border-border dark:bg-[#090909] dark:border-white/[0.06] focus:border-text-main/20 dark:focus:border-white/20 rounded-xl pl-14 pr-6 outline-none text-[15px] transition-all placeholder:text-text-muted/30 dark:placeholder:text-white/20"
                    required
                  />
                </motion.div>
                {authMode === 'register' && (
                  <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted/60 dark:text-white/40 group-focus-within:text-[#FF8B66] transition-colors">
                      <span className="material-symbols-outlined text-xl">verified_user</span>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full h-16 bg-surface border border-border dark:bg-[#090909] dark:border-white/[0.06] focus:border-text-main/20 dark:focus:border-white/20 rounded-xl pl-14 pr-6 outline-none text-[15px] transition-all placeholder:text-text-muted/30 dark:placeholder:text-white/20"
                      required
                    />
                  </motion.div>
                )}
              </div>

              <motion.button
                variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
                type="submit"
                disabled={isLoading}
                className="group relative w-full h-16 bg-surface hover:bg-background border border-border hover:border-text-main/10 dark:bg-[#0a0a0a] dark:hover:bg-[#0f0f0f] dark:border-white/10 dark:hover:border-white/20 text-text-main dark:text-white rounded-[1.25rem] font-bold text-[13px] uppercase tracking-[0.35em] shadow-sm dark:shadow-xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/[0.01] dark:from-white/[0.04] to-transparent pointer-events-none" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-text-main/20 dark:border-white/20 border-t-text-main dark:border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="relative drop-shadow-sm">{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
              </motion.button>

              <motion.div
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-5 mt-4"
              >
                <div className="h-[1px] w-8 bg-border dark:bg-white/10 mx-auto" />
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="w-full text-center text-[10px] font-black text-text-main dark:text-white/90 uppercase tracking-[0.4em] hover:opacity-60 transition-all duration-300"
                >
                  {authMode === 'login' ? "Create Account" : "Sign In"}
                </button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Section - Minimalist Legal Only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 text-center mb-2"
      >
        <p className="text-[10px] text-text-muted dark:text-white/60 tracking-wide leading-relaxed max-w-[280px] mx-auto uppercase">
          By continuing, you agree to our <span
            onClick={() => onNavigate('terms')}
            className="text-text-main dark:text-white opacity-80 underline cursor-pointer hover:opacity-100 transition-opacity"
          >Terms</span> & <span
            onClick={() => onNavigate('privacy')}
            className="text-text-main dark:text-white opacity-80 underline cursor-pointer hover:opacity-100 transition-opacity"
          >Privacy Policy</span>
        </p>
      </motion.div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600&display=swap');
        .font-serif {
          font-family: 'Crimson Pro', serif;
        }
      `}} />
    </div>
  );
};

interface ButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const AuthButton: React.FC<ButtonProps> = ({ icon, label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full h-16 bg-surface hover:bg-background border border-border hover:border-text-main/10 dark:bg-[#0a0a0a] dark:hover:bg-[#0f0f0f] dark:border-white/10 dark:hover:border-white/20 rounded-[1.25rem] flex items-center px-6 gap-5 transition-all active:scale-[0.98] group disabled:opacity-50 shadow-sm dark:shadow-xl relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-black/[0.01] dark:from-white/[0.04] to-transparent pointer-events-none" />
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
    <div className="w-6 flex items-center justify-center text-text-main/70 dark:text-white/80 group-hover:text-text-main dark:group-hover:text-white group-hover:scale-110 transition-all duration-500">
      {icon}
    </div>
    <span className="text-[14px] font-bold text-text-main/70 dark:text-white/70 group-hover:text-text-main dark:group-hover:text-white tracking-wide transition-colors duration-300">{label}</span>
    <span className="material-symbols-outlined ml-auto text-lg text-text-muted/5 dark:text-white/5 group-hover:text-text-main/20 dark:group-hover:text-white/20 transition-all duration-500 translate-x-1 group-hover:translate-x-0">
      arrow_forward_ios
    </span>
  </button>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
    <path className="fill-[#737373] dark:fill-[#f3f3f3]" d="M0 0h11v11H0z" />
    <path className="fill-[#737373] dark:fill-[#f3f3f3]" d="M12 0h11v11H12z" />
    <path className="fill-[#737373] dark:fill-[#f3f3f3]" d="M0 12h11v11H0z" />
    <path className="fill-[#737373] dark:fill-[#f3f3f3]" d="M12 12h11v11H12z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 20.28c-.96.95-2.19 1.95-3.53 1.95s-1.89-.92-3.48-.92c-1.6 0-2.22.89-3.48.95-1.27.06-2.48-.98-3.48-1.99-2.04-2.04-3.59-5.76-3.59-8.49 0-4.32 2.64-6.58 5.16-6.58 1.3 0 2.45.89 3.25.89s2.1-.96 3.63-.96c.64 0 2.5.24 3.73 2.05-1.01.61-1.69 1.76-1.69 3.12 0 1.63.95 2.83 2.37 3.45-.31 1.05-1.39 2.53-2.39 3.53zm-3.03-15.68c.7-.87 1.18-2.08 1.18-3.28 0-.17-.02-.34-.05-.51-1.09.05-2.41.73-3.19 1.64-.7.81-1.32 2.05-1.32 3.22 0 .19.03.38.07.51.13.01.27.02.41.02 1 0 2.2-.6 2.9-1.6z" />
  </svg>
);

export default AuthPage;
