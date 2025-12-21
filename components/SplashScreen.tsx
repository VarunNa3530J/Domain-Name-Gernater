import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => prev < 100 ? prev + 3 : 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F7F9FB] dark:bg-[#121212] overflow-hidden transition-colors">
      {/* Subtle Background Accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#FF8B66]/10 rounded-full blur-[100px]"></div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Logo Container - Matches App Squircle Style */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
          className="w-24 h-24 rounded-[1.75rem] bg-white dark:bg-[#1E1E1E] shadow-xl border border-black/5 dark:border-white/5 flex items-center justify-center mb-6"
        >
          <img src="/logo.png" alt="Namelime" className="w-14 h-14 object-contain" />
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-black text-black dark:text-white tracking-tight mb-1"
        >
          Namelime
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF8B66]"
        >
          Premium Naming
        </motion.p>

        {/* Progress Bar - Matches App Style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 w-40 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-[#FF8B66] rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-8 text-[9px] font-medium text-black/20 dark:text-white/20 uppercase tracking-widest"
      >
        Loading...
      </motion.p>
    </div>
  );
};

export default SplashScreen;
