import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyBillWave, FaTimes } from 'react-icons/fa';

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
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors z-10"
          >
            <FaTimes size={14} />
          </button>

          <div className="relative z-10 mt-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 border-4 border-emerald-100">
              <FaMoneyBillWave className="text-3xl text-emerald-600" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Smart Income Split</h2>
              <p className="text-sm text-gray-500">Based on the 50/30/20 Rule</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">₵ {income.amount.toFixed(2)}</p>
            </div>

            <div className="space-y-3">
              {/* Needs */}
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div>
                  <p className="font-bold text-blue-800 text-sm">Needs (50%)</p>
                  <p className="text-xs text-blue-600">Rent, Food, Bills</p>
                </div>
                <span className="font-bold text-blue-700">₵ {needs.toFixed(2)}</span>
              </div>

              {/* Wants */}
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div>
                  <p className="font-bold text-purple-800 text-sm">Wants (30%)</p>
                  <p className="text-xs text-purple-600">Shopping, Fun</p>
                </div>
                <span className="font-bold text-purple-700">₵ {wants.toFixed(2)}</span>
              </div>

              {/* Savings */}
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div>
                  <p className="font-bold text-emerald-800 text-sm">Savings (20%)</p>
                  <p className="text-xs text-emerald-600">Investments, Debt</p>
                </div>
                <span className="font-bold text-emerald-700">₵ {savings.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors shadow-lg"
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
