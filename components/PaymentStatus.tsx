import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { haptics } from '../services/hapticsService';

interface Props {
    status: 'success' | 'cancel';
    onClose: () => void;
}

const PaymentStatus: React.FC<Props> = ({ status, onClose }) => {
    useEffect(() => {
        if (status === 'success') {
            haptics.notification('success' as any);
        } else {
            haptics.notification('error' as any);
        }
    }, [status]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm glass-premium rounded-[3rem] p-10 text-center shadow-2xl overflow-hidden relative"
            >
                {/* Background Decor */}
                <div className={`absolute top-0 left-0 w-full h-2 ${status === 'success' ? 'bg-primary' : 'bg-red-500'}`}></div>

                <div className={`w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center ${status === 'success' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                    <span className="material-symbols-outlined text-4xl">
                        {status === 'success' ? 'verified_user' : 'error'}
                    </span>
                </div>

                <h2 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter mb-4 leading-none font-display">
                    {status === 'success' ? 'Purchase Complete' : 'Payment Cancelled'}
                </h2>

                <p className="text-zinc-600 dark:text-zinc-400 font-bold mb-10 leading-relaxed px-4">
                    {status === 'success'
                        ? 'Your identity has been elevated. Founder Pro features are now active. Build your empire. 🍋'
                        : 'The process was interrupted. No charges were made. You can try again whenever you\'re ready.'
                    }
                </p>

                <button
                    onClick={onClose}
                    className={`w-full h-16 rounded-full font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${status === 'success'
                            ? 'bg-zinc-950 dark:bg-white text-white dark:text-black'
                            : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                        }`}
                >
                    {status === 'success' ? 'Enter The Studio' : 'Back to App'}
                </button>
            </motion.div>
        </div>
    );
};

export default PaymentStatus;
