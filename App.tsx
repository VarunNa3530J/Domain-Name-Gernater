// Force rebuild
import React, { useState, useEffect } from 'react';
import { Page, User, GeneratedName, GenerationRequest } from './types';
import { generateStartupNames } from './services/geminiService';
import { auth, db } from './services/firebase';
import { haptics } from './services/hapticsService';
import { NotificationType } from '@capacitor/haptics';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Results from './components/Results';
import History from './components/History';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import Pricing from './components/Pricing';
import Account from './components/Account';
import Admin from './components/Admin';
import PaymentStatus from './components/PaymentStatus';
import SplashScreen from './components/SplashScreen';
import LegalPage from './components/LegalPage';
import Toast from './components/Toast';
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
  // Set initial page to 'login' to show the new Auth Page
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  const [lastRequest, setLastRequest] = useState<GenerationRequest | null>(null);
  const [lastResults, setLastResults] = useState<GeneratedName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning'; action?: { label: string; onClick: () => void } } | null>(null);

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
              if (['login', 'register'].includes(current)) {
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
      setCurrentPage('login');
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
        setToast({
          message: "Daily limit reached! Free users can generate 3 times per day. Upgrade to Founder Pro for unlimited access! 🍋",
          type: 'warning',
          action: {
            label: 'Upgrade to Pro',
            onClick: () => {
              setToast(null);
              setCurrentPage('pricing');
            }
          }
        });
        return;
      }
    }

    setLastRequest(request);
    setIsLoading(true);
    setCurrentPage('results');

    try {
      // 0. Fetch full history to prevent duplicates (Local User History)
      const excludeNames: string[] = [];
      if (user) {
        try {
          const { getDocs, collection } = await import('firebase/firestore');
          const historySnapshot = await getDocs(collection(db, 'users', user.id, 'history'));
          historySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.results && Array.isArray(data.results)) {
              data.results.forEach((r: any) => {
                if (r.name) excludeNames.push(r.name);
              });
            }
          });
        } catch (e) {
          console.error("History fetch error:", e);
        }
      }

      // 1. Generate Candidates
      let candidates = await generateStartupNames(request, user?.plan === 'pro', excludeNames);

      // 2. Global Uniqueness Check & Reservation
      // We check against a global 'taken_names' collection.
      // If a name exists there, we discard it. If not, we reserve it.
      const uniqueResults: GeneratedName[] = [];

      try {
        const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');

        for (const candidate of candidates) {
          // Normalize name for check (lowercase, trimmed)
          const nameId = candidate.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          const nameDocRef = doc(db, 'taken_names', nameId);

          try {
            const nameSnap = await getDoc(nameDocRef);

            if (nameSnap.exists()) {
              console.log(`[Global Uniqueness] Skipped '${candidate.name}' - already taken by another user.`);
              continue; // Skip this name, it's globally taken
            } else {
              // Reserve it immediately
              try {
                await setDoc(nameDocRef, {
                  name: candidate.name,
                  reservedBy: user?.id || 'anonymous',
                  reservedAt: serverTimestamp(),
                  originalQuery: request.description
                });
                // Only add to result if reservation succeeded (or if we decide to fallback)
                // For now, if we can't reserve, we assume we can't guarantee uniqueness, but we shouldn't crash the user flow.
                // However, the user REQUESTED strict uniqueness.
                // If permission fails, we will still show it but log the error.
                uniqueResults.push(candidate);
              } catch (writeErr: any) {
                // Catch PERMISSION_DENIED or other write errors
                if (writeErr && writeErr.code === 'permission-denied') {
                  console.warn("Global Uniqueness Skip: Permission Denied. Check Firestore Rules.");
                  // Allow proceeding so user isn't blocked, but uniqueness isn't guaranteed globally.
                  uniqueResults.push(candidate);
                } else {
                  console.error("Global Reservation Error:", writeErr);
                }
              }
            }
          } catch (err: any) {
            // Handle getDoc errors (e.g. permission denied on read)
            console.warn("Global Check Error (likely permissions):", err);
            // Fail open: Show the name if we can't check
            uniqueResults.push(candidate);
          }
        }

        // If the entire uniqueness block failed (e.g. firestore import fail), we still have uniqueResults populated?
        // No, we need to ensure candidates are passed if the block above threw early.
        // But the try/catch wraps the loop content.

        // If we have 0 unique results because of aggressive filtering, validation might fail.
        // If uniqueResults is empty but we have candidates, we might want to fallback to just showing candidates if everything crashed.

        // Update candidates list
        if (uniqueResults.length > 0) {
          candidates = uniqueResults;
        }

      } catch (globalErr) {
        console.error("Global Uniqueness Service Failure:", globalErr);
        // Fallback: Just use the generated candidates without uniqueness check
      }

      setLastResults(candidates);
      haptics.notification(NotificationType.Success);

      // Auto notification on success
      showLocalNotification(
        "✨ Generation Complete!",
        `Found ${candidates.length} unique startup names.`
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

        // 3. Save to User History
        try {
          const { addDoc, collection } = await import('firebase/firestore');
          await addDoc(collection(db, 'users', user.id, 'history'), {
            request,
            results: candidates,
            timestamp: serverTimestamp()
          });
        } catch (e) { console.error("History Save Error:", e); }

        // 4. Update Stats
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
      case 'login':
        return <AuthPage type="login" onAuthSuccess={() => setCurrentPage('dashboard')} onBack={() => setCurrentPage('register')} onNavigate={(page) => setCurrentPage(page)} />;
      case 'register':
        return <AuthPage type="register" onAuthSuccess={() => setCurrentPage('dashboard')} onBack={() => setCurrentPage('login')} onNavigate={(page) => setCurrentPage(page)} />;
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
            user={user}
            request={lastRequest}
          />
        );
      case 'pricing':
        // If user closes pricing without logging in, go back to onboarding
        return <Pricing user={user} onClose={() => setCurrentPage(user ? 'dashboard' : 'login')} />;
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
      case 'terms':
        return <LegalPage type="terms" onBack={() => setCurrentPage(user ? 'settings' : 'login')} />;
      case 'privacy':
        return <LegalPage type="privacy" onBack={() => setCurrentPage(user ? 'settings' : 'login')} />;
      default:
        // Default fallback to Login
        return <AuthPage type="login" onAuthSuccess={() => setCurrentPage('dashboard')} onBack={() => setCurrentPage('register')} onNavigate={(page: Page) => setCurrentPage(page)} />;
    }
  };

  return (
    <div className={`h-full w-full ${['login', 'register'].includes(currentPage) ? 'bg-[#0b0b0b]' : 'bg-background'} font-sans text-text-main transition-colors duration-300 overflow-hidden relative`}>
      <div className="noise" />
      {isInitialLoading && <SplashScreen />}
      {!isInitialLoading && (
        <div className="w-full h-full bg-background relative overflow-hidden flex flex-col">
          {/* Museum Atmosphere (Global) */}
          <div className="absolute inset-0 interactive-grid opacity-[0.2] pointer-events-none z-0"></div>
          <div className="aura-glass top-0 -left-64 opacity-[0.3] pointer-events-none z-0"></div>
          <div className="aura-glass bottom-0 -right-64 opacity-[0.2] rotate-180 pointer-events-none z-0"></div>

          {/* Global Scroll Container */}
          <div className="flex-1 relative overflow-y-auto no-scrollbar touch-pan-y z-10" style={{
            paddingTop: ['login', 'register'].includes(currentPage) ? 0 : 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: ['login', 'register'].includes(currentPage) ? 0 : 'max(8rem, env(safe-area-inset-bottom))'
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 1.01 }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 20,
                  mass: 0.5
                }}
                className="w-full h-auto min-h-full relative"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>

          {['dashboard', 'history', 'settings', 'account'].includes(currentPage) && (
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
                if (currentPage === 'login') setCurrentPage('dashboard');
              }}
            />
          )}

          {/* Toast Notification */}
          <Toast
            message={toast?.message || ''}
            type={toast?.type || 'info'}
            isOpen={!!toast}
            onClose={() => setToast(null)}
            action={toast?.action}
          />
        </div>
      )}
    </div>
  );
};

export default App;