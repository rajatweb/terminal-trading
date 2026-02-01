"use client";

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-elevated rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${variant === 'danger' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                            <AlertTriangle size={20} className={variant === 'danger' ? 'text-red-500' : 'text-yellow-500'} />
                        </div>
                        <h3 className="text-[14px] font-black text-foreground uppercase tracking-tight">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-surface-hover rounded transition-colors"
                    >
                        <X size={18} className="text-text-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-[13px] text-text-secondary leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-surface-hover/50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[11px] font-bold text-text-muted hover:bg-surface-hover rounded transition-colors uppercase"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 text-[11px] font-bold text-white rounded transition-colors uppercase ${variant === 'danger'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
