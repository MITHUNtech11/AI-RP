import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isAlert = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[var(--color-card)] rounded-3xl shadow-xl z-50 overflow-hidden border border-[var(--color-border)]/50"
          >
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-[var(--color-foreground)]">{title}</h3>
              <p className="text-sm font-medium text-[var(--color-muted-foreground)] leading-relaxed">
                {message}
              </p>
              <div className="flex gap-3 pt-4">
                {!isAlert && (
                  <Button variant="outline" className="flex-1 rounded-xl h-12 font-semibold" onClick={onCancel}>
                    {cancelText}
                  </Button>
                )}
                <Button variant={isAlert ? "default" : "destructive"} className="flex-1 rounded-xl h-12 font-semibold" onClick={onConfirm}>
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
