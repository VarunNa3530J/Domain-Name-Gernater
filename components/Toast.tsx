import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
    message: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    isOpen: boolean;
    onClose: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', isOpen, onClose, action }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            default: return 'ℹ';
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return 'from-green-500/10 to-green-500/5 border-green-500/30 text-green-600';
            case 'error': return 'from-red-500/10 to-red-500/5 border-red-500/30 text-red-600';
            case 'warning': return 'from-amber-500/10 to-amber-500/5 border-amber-500/30 text-amber-600';
            default: return 'from-[#FF8B66]/10 to-[#FF8B66]/5 border-[#FF8B66]/30 text-[#FF8B66]';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-24 left-4 right-4 z-[200] flex justify-center"
                >
                    <div className={`w-full max-w-md bg-gradient-to-br ${getColors()} backdrop-blur-xl border rounded-2xl p-4 shadow-premium`}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface/50 flex items-center justify-center text-xl">
                                {getIcon()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-main leading-relaxed whitespace-pre-line">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-surface/30 flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined text-base text-text-muted">close</span>
                            </button>
                        </div>
                        {action && (
                            <button
                                onClick={action.onClick}
                                className="mt-3 w-full py-2.5 rounded-xl bg-surface/80 hover:bg-surface transition-colors text-sm font-semibold text-text-main"
                            >
                                {action.label}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
