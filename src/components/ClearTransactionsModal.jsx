import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTrash, FaTimes, FaSpinner } from 'react-icons/fa';

const ClearTransactionsModal = ({ isOpen, onClose, onConfirm, count = 0, isDeleting = false }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0d253d]/50 backdrop-blur-sm"
        />

        {/* Modal Container - DESIGN.md Card Surface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-gray-800 rounded-xl p-6 max-w-sm w-full shadow-[0_8px_24px_rgba(0,55,112,0.16)] relative overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 btn-stripe-icon !w-8 !h-8"
          >
            <FaTimes size={13} />
          </button>

          {/* Warning Header with Stripe Ruby token */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#ea2261]/10 text-[#ea2261] flex items-center justify-center text-lg border border-[#ea2261]/20">
              <FaExclamationTriangle />
            </div>
            
            <h3 className="text-lg font-light text-[#0d253d] dark:text-white tracking-tight">
              Clear All Transactions?
            </h3>
            
            <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal leading-relaxed">
              This action will permanently delete <strong className="text-[#ea2261] font-normal font-tnum">{count} transaction{count === 1 ? '' : 's'}</strong> from your account. This cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="btn-stripe-secondary flex-1 py-2 text-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting || count === 0}
              className="btn-stripe-danger flex-1 py-2 text-xs border-0 !bg-[#ea2261] hover:!bg-[#ea2261]/90 !text-white"
            >
              {isDeleting ? (
                <>
                  <FaSpinner className="animate-spin" size={13} />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <FaTrash size={11} />
                  <span>Clear All</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClearTransactionsModal;
