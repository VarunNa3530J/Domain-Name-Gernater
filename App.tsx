import React, { useState, useEffect } from 'react';
import { Page, User, GeneratedName, GenerationRequest } from './types';
import { generateStartupNames } from './services/geminiService';
import { auth, db } from './services/firebase';
import { haptics } from './services/hapticsService';
import { NotificationType } from '@capacitor/haptics';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Results from './components/Results';
import Onboarding from './components/Onboarding';
import History from './components/History';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import Pricing from './components/Pricing';
import Account from './components/Account';
import Admin from './components/Admin';
import PaymentStatus from './components/PaymentStatus';
import SplashScreen from './components/SplashScreen';
import { initializePushNotifications, showLocalNotification } from './services/notificationService';

const getHighResAvatarUrl = (url: string | null, name: string) => {
  if (!url) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EBFF00&color=000&size=512`;
  }

  // Force Google HD: Replace =s96-c (default) with =s512-c
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=s\d+-c/, '=s512-c').replace(/\?sz=\d+/, '?sz=512');
  }

  return url;
};

const App: React.FC = () => {
  // Set initial page to 'onboarding'
  const [currentPage, setCurrentPage] = useState<Page>('onboarding');
  const [user, setUser] = useState<User | null>(null);
  const [lastResults, setLastResults] = useState<GeneratedName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    console.log('[App] Setting up onAuthStateChanged listener...');

    // Safety timeout: If auth takes too long, stop showing splash
    const loadingTimeout = setTimeout(() => {
      setIsInitialLoading(prev => {
        if (prev) console.warn('[App] Initial loading timed out after 8s - forcing splash hide.');
        return false;
      });
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[App] Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No User');

      if (firebaseUser) {
        let plan = 'free';
        let credits = 5;
        let genCount = 0;
        let lastDate = '';
        let role: 'admin' | 'user' = 'user';

        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            plan = data.plan || 'free';
            credits = data.credits ?? 5;
            genCount = data.generationsTodayCount || 0;
            lastDate = data.lastGenerationDate || '';
            role = data.role || 'user';
            let planExpiresAt = data.planExpiresAt || '';
            const isPlanActive = data.isPlanActive ?? (plan === 'pro');

            // BACKFILL: If Pro but no date, set it to 30 days from now
            if (plan === 'pro' && !planExpiresAt) {
              const d = new Date();
              d.setDate(d.getDate() + 30);
              planExpiresAt = d.toISOString();

              // Persist this fix
              const { updateDoc, doc } = await import('firebase/firestore');
              updateDoc(doc(db, 'users', firebaseUser.uid), { planExpiresAt });
            }

            // EXPIRY GUARD: Check if plan is actually expired
            if (plan === 'pro' && planExpiresAt) {
              const now = new Date();
              const expiry = new Date(planExpiresAt);
              if (now > expiry) {
                console.log('[App] Subscription expired! Reverting to free...');
                plan = 'free';
                // Trigger background update
                const { updateDoc, doc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                  plan: 'free',
                  isPlanActive: false
                });
              }
            }

            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              plan: plan as 'free' | 'pro',
              planExpiresAt: planExpiresAt,
              planInterval: data.planInterval || 'monthly',
              isPlanActive: isPlanActive,
              credits: credits,
              generationsTodayCount: genCount,
              lastGenerationDate: lastDate,
              avatarUrl: getHighResAvatarUrl(firebaseUser.photoURL, firebaseUser.displayName || 'User'),
              role: role,
            });

            // Initialize real push notifications
            initializePushNotifications(firebaseUser.uid);

            // Navigation Logic
            setCurrentPage(current => {
              if (['onboarding', 'login', 'register'].includes(current)) {
                return 'dashboard';
              }
              return current;
            });
          } else {
            console.warn('[App] User record missing in Firestore - creating new record...');

            const newUser = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
              role: 'user',
              plan: 'free',
              credits: 5,
              generationsTodayCount: 0,
              lastGenerationDate: '',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            };

            // 1. Persist to Firestore
            const { setDoc, doc } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

            // 2. Set Local State
            setUser({
              id: firebaseUser.uid,
              name: newUser.name,
              email: newUser.email,
              plan: 'free',
              credits: 5,
              generationsTodayCount: 0,
              lastGenerationDate: '',
              avatarUrl: getHighResAvatarUrl(firebaseUser.photoURL, newUser.name),
              role: 'user',
            });
          }
        } catch (e) {
          console.error("[App] Data Fetch/Creation Error:", e);
        }
      } else {
        setUser(null);
      }

      setIsInitialLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Theme Persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  // Navigation Scroll Reset
  useEffect(() => {
    // Reset window scroll
    window.scrollTo(0, 0);

    // Reset our custom mobile scroll container (#root)
    const rootContainer = document.getElementById('root');
    if (rootContainer) {
      rootContainer.scrollTo({
        top: 0,
        behavior: 'instant' as any // Use 'instant' for immediate snap
      });
    }
  }, [currentPage]);

  // Payment Status Handling
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancel' | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const intervalArg = urlParams.get('interval') as 'year' | 'month' | null;

    if (status === 'success' && user && user.plan !== 'pro') {
      const updateProStatus = async () => {
        try {
          const { setDoc, doc } = await import('firebase/firestore');
          const expiryDate = new Date();
          const isYearly = intervalArg === 'year';

          if (isYearly) {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          }

          const planInterval = isYearly ? 'yearly' : 'monthly';

          await setDoc(doc(db, 'users', user.id), {
            plan: 'pro',
            credits: 9999,
            planExpiresAt: expiryDate.toISOString(),
            planInterval: planInterval
          }, { merge: true });

          setUser({
            ...user,
            plan: 'pro',
            credits: 9999,
            planExpiresAt: expiryDate.toISOString(),
            planInterval: planInterval
          });
          setPaymentStatus('success');
        } catch (e) {
          console.error("Error upgrading user:", e);
        }
      };

      updateProStatus();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'cancel') {
      setPaymentStatus('cancel');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  // Firebase Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('onboarding');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };


  const handleHistorySelect = (results: GeneratedName[]) => {
    setLastResults(results);
    setCurrentPage('results');
  };

  const handleGenerate = async (request: GenerationRequest) => {
    if (user && user.plan === 'free') {
      const today = new Date().toISOString().split('T')[0];
      const counts = user.lastGenerationDate === today ? user.generationsTodayCount : 0;

      if (counts >= 3) {
        alert("Daily limit reached! Free users can generate 3 times per day. Upgrade to Founder Pro for unlimited access! 🍋");
        setCurrentPage('pricing');
        return;
      }
    }

    setIsLoading(true);
    setCurrentPage('results');

    try {
      const results = await generateStartupNames(request, user?.plan === 'pro');
      setLastResults(results);
      haptics.notification(NotificationType.Success);

      // Auto notification on success
      showLocalNotification(
        "✨ Generation Complete!",
        `Found ${results.length} fresh startup names for you.`
      );

      if (user) {
        const today = new Date().toISOString().split('T')[0];
        const newCount = (user.lastGenerationDate === today ? user.generationsTodayCount : 0) + 1;

        // Update local state
        setUser({
          ...user,
          generationsTodayCount: newCount,
          lastGenerationDate: today,
          // Sync credits only for visual backward compatibility if needed, but we'll phase them out
          credits: user.plan === 'free' ? 3 - newCount : 999
        });

        // 1. Save to History
        try {
          await addDoc(collection(db, 'users', user.id, 'history'), {
            request,
            results,
            timestamp: serverTimestamp()
          });
        } catch (e) { console.error("History Save Error:", e); }

        // 2. Update Stats
        try {
          const { setDoc, doc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', user.id), {
            generationsTodayCount: newCount,
            lastGenerationDate: today,
            credits: user.plan === 'free' ? 3 - newCount : 999,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        } catch (e) { console.error("Stats Update Error:", e); }
      }
    } catch (e) {
      console.error('[Generate] Main Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'onboarding':
        return (
          <Onboarding
            onComplete={() => setCurrentPage('register')}
            onSkip={() => setCurrentPage('login')}
            onLogin={() => setCurrentPage('login')}
          />
        );
      case 'login':
        return <AuthPage type="login" onAuthSuccess={() => setCurrentPage('dashboard')} onSwitch={() => setCurrentPage('register')} />;
      case 'register':
        return <AuthPage type="register" onAuthSuccess={() => setCurrentPage('dashboard')} onSwitch={() => setCurrentPage('login')} />;
      case 'dashboard':
        return (
          <Dashboard
            user={user!}
            onGenerate={handleGenerate}
            onNavigate={(page: Page) => setCurrentPage(page)}
          />
        );
      case 'results':
        return (
          <Results
            isLoading={isLoading}
            results={lastResults}
            onBack={() => setCurrentPage('dashboard')}
          />
        );
      case 'pricing':
        // If user closes pricing without logging in, go back to onboarding
        return <Pricing user={user} onClose={() => setCurrentPage(user ? 'dashboard' : 'onboarding')} />;
      case 'account':
        return (
          <Account
            user={user!}
            onBack={() => setCurrentPage('dashboard')}
            // Redirect to onboarding on logout
            onLogout={handleLogout}
            onUpgrade={() => setCurrentPage('pricing')}
          />
        );
      case 'history':
        return <History user={user!} onSelect={handleHistorySelect} />;
      case 'settings':
        return (
          <Settings
            user={user!}
            onNavigate={(page) => setCurrentPage(page)}
            // Redirect to onboarding on logout
            onLogout={handleLogout}
          />
        );
      case 'admin':
        if (user?.role !== 'admin') {
          return <Settings user={user!} onNavigate={(page) => setCurrentPage(page)} onLogout={handleLogout} />;
        }
        return (
          <Admin
            currentUser={user!}
            onBack={() => setCurrentPage('settings')}
          />
        );
      default:
        // Default fallback to Onboarding
        return (
          <Onboarding
            onComplete={() => setCurrentPage('register')}
            onSkip={() => setCurrentPage('login')}
            onLogin={() => setCurrentPage('login')}
          />
        );
    }
  };

  return (
    <div className="h-full w-full bg-background font-sans text-text-main transition-colors duration-300 overflow-hidden relative">
      <div className="noise" />
      {isInitialLoading && <SplashScreen />}
      {!isInitialLoading && (
        <div className="w-full h-full bg-background relative overflow-hidden flex flex-col">
          {/* Museum Atmosphere (Global) */}
          <div className="absolute inset-0 interactive-grid opacity-[0.2] pointer-events-none z-0"></div>
          <div className="aura-glass top-0 -left-64 opacity-[0.3] pointer-events-none z-0"></div>
          <div className="aura-glass bottom-0 -right-64 opacity-[0.2] rotate-180 pointer-events-none z-0"></div>

          {/* Global Scroll Container */}
          <div className="flex-1 relative overflow-y-auto no-scrollbar touch-pan-y z-10" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(8rem, env(safe-area-inset-bottom))' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 1.01 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
                className="w-full h-auto min-h-full relative"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>

          {['dashboard', 'history', 'settings', 'results', 'account'].includes(currentPage) && (
            <BottomNav
              activePage={currentPage}
              onNavigate={setCurrentPage}
            />
          )}

          {/* Pricing Overlay */}
          {currentPage === 'pricing' && (
            <div className="fixed inset-0 z-[100] animate-slide-up bg-background overflow-y-auto">
              <Pricing
                user={user}
                onClose={() => setCurrentPage('dashboard')}
              />
            </div>
          )}

          {/* Payment Result Overlay */}
          {paymentStatus && (
            <PaymentStatus
              status={paymentStatus}
              onClose={() => {
                setPaymentStatus(null);
                if (currentPage === 'onboarding') setCurrentPage('dashboard');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default App;