import React from 'react';
import { Page } from '../types';
import { haptics } from '../services/hapticsService';
import { motion } from 'framer-motion';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const BottomNav: React.FC<Props> = ({ activePage, onNavigate }) => {
  const navItems: { page: Page; icon: string; label: string }[] = [
    { page: 'dashboard', icon: 'home', label: 'Home' },
    { page: 'history', icon: 'history', label: 'History' },
    { page: 'settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed left-0 w-full z-50 pointer-events-none flex justify-center"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="bg-surface backdrop-blur-md border border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] p-2 pointer-events-auto flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = activePage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => {
                onNavigate(item.page);
                haptics.selectionChanged();
              }}
              className="relative px-6 py-3 rounded-[1.5rem] transition-all duration-300 active:scale-95 flex items-center justify-center group"
            >
              {/* Active Background Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-[#FF8B66]/15 dark:bg-[#FF8B66]/20 rounded-[1.5rem] transition-all duration-300" />
              )}

              <span
                className={`material-symbols-outlined text-[26px] z-10 transition-all duration-300 ${isActive
                  ? 'text-[#FF8B66] font-bold'
                  : 'text-text-muted group-hover:text-text-main'
                  }`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
              >
                {item.icon}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BottomNav;