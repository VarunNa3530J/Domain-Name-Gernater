import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-surface w-full max-w-sm rounded-2xl border border-border overflow-hidden shadow-2xl"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'danger' ? 'bg-red-500/10 text-red-500' :
                                    type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {type === 'danger' ? 'warning' : type === 'warning' ? 'error' : 'info'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-text-main">{title}</h3>
                            </div>
                            <p className="text-sm text-text-muted leading-relaxed mb-6">
                                {message}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 rounded-xl bg-surface border border-border text-sm font-bold text-text-main hover:bg-border transition-colors uppercase tracking-wider"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold text-white uppercase tracking-wider transition-all shadow-lg ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                                        type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                                            'bg-[#FF8B66] hover:bg-[#ff7b52] shadow-[#FF8B66]/20'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
