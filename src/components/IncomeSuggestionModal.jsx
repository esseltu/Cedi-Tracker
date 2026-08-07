import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyBillWave, FaTimes } from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

const IncomeSuggestionModal = ({ income, onClose }) => {
  if (!income) return null;

  // 50:30:20 Rule
  const needs = income.amount * 0.50;
  const wants = income.amount * 0.30;
  const savings = income.amount * 0.20;

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
        
        {/* Modal Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-gray-800 rounded-xl shadow-[0_8px_24px_rgba(0,55,112,0.16)] p-6 w-full max-w-sm overflow-hidden"
        >
          {/* Decorative Mesh Header */}
          <div 
            className="absolute top-0 left-0 w-full h-20"
            style={{
              background: 'linear-gradient(135deg, #1c1e54 0%, #0d253d 50%, #4434d4 100%)'
            }}
          />
          
          <button 
            type="button"
            onClick={onClose} 
            className="absolute top-3 right-3 btn-stripe-icon !w-7 !h-7 !bg-white/20 !border-white/30 text-white z-10"
          >
            <FaTimes size={12} />
          </button>

          <div className="relative z-10 mt-3">
            <div className="w-14 h-14 bg-white dark:bg-[#1c1e54] rounded-full flex items-center justify-center shadow-md mx-auto mb-3 border-2 border-[#533afd]/20">
              <FaMoneyBillWave className="text-2xl text-[#533afd]" />
            </div>

            <div className="text-center mb-5">
              <h2 className="text-lg font-light text-[#0d253d] dark:text-white tracking-tight">Smart Income Split</h2>
              <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">Based on the 50/30/20 Rule</p>
              <p className="text-2xl font-light text-[#533afd] dark:text-[#665efd] mt-1 font-tnum">{formatCurrency(income.amount)}</p>
            </div>

            <div className="space-y-2.5">
              {/* Needs */}
              <div className="flex justify-between items-center p-3 bg-[#533afd]/5 dark:bg-[#533afd]/15 rounded-lg border border-[#533afd]/20">
                <div>
                  <p className="font-normal text-[#533afd] text-xs">Needs (50%)</p>
                  <p className="text-[11px] text-[#64748d] dark:text-gray-400 font-normal">Rent, Food, Bills</p>
                </div>
                <span className="font-normal text-[#533afd] font-tnum text-sm">{formatCurrency(needs)}</span>
              </div>

              {/* Wants */}
              <div className="flex justify-between items-center p-3 bg-[#f96bee]/5 dark:bg-[#f96bee]/15 rounded-lg border border-[#f96bee]/20">
                <div>
                  <p className="font-normal text-[#f96bee] text-xs">Wants (30%)</p>
                  <p className="text-[11px] text-[#64748d] dark:text-gray-400 font-normal">Shopping, Fun</p>
                </div>
                <span className="font-normal text-[#f96bee] font-tnum text-sm">{formatCurrency(wants)}</span>
              </div>

              {/* Savings */}
              <div className="flex justify-between items-center p-3 bg-[#059669]/5 dark:bg-[#059669]/15 rounded-lg border border-[#059669]/20">
                <div>
                  <p className="font-normal text-[#059669] text-xs">Savings (20%)</p>
                  <p className="text-[11px] text-[#64748d] dark:text-gray-400 font-normal">Investments, Debt</p>
                </div>
                <span className="font-normal text-[#059669] font-tnum text-sm">{formatCurrency(savings)}</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="btn-stripe-primary w-full mt-5 py-2.5 text-xs font-normal"
            >
              Got it, thanks!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncomeSuggestionModal;
