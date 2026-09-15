import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyBillWave, FaTimes, FaEdit } from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

const DEFAULT_SPLIT = [
  { id: 'needs', name: 'Needs', subtitle: 'Food, Transport, Essentials', percent: 40 },
  { id: 'wants', name: 'Wants', subtitle: 'Shopping, Fun', percent: 25 },
  { id: 'savings', name: 'Savings', subtitle: 'Investments, Debt', percent: 20 },
  { id: 'support', name: 'Support', subtitle: 'Family, Girlfriend, Others', percent: 15 }
];

const COLORS = [
  { text: 'text-[#533afd]', bg: 'bg-[#533afd]/5 dark:bg-[#533afd]/15', border: 'border-[#533afd]/20' },
  { text: 'text-[#f96bee]', bg: 'bg-[#f96bee]/5 dark:bg-[#f96bee]/15', border: 'border-[#f96bee]/20' },
  { text: 'text-[#059669]', bg: 'bg-[#059669]/5 dark:bg-[#059669]/15', border: 'border-[#059669]/20' },
  { text: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/5 dark:bg-[#f59e0b]/15', border: 'border-[#f59e0b]/20' }
];

const IncomeSuggestionModal = ({ income, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [splitConfig, setSplitConfig] = useState(() => {
    const saved = localStorage.getItem('incomeSplitConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SPLIT;
      }
    }
    return DEFAULT_SPLIT;
  });
  
  const [editConfig, setEditConfig] = useState(splitConfig);

  useEffect(() => {
    if (isEditing) {
      setEditConfig(splitConfig);
    }
  }, [isEditing, splitConfig]);

  if (!income) return null;

  const handleSave = () => {
    setSplitConfig(editConfig);
    localStorage.setItem('incomeSplitConfig', JSON.stringify(editConfig));
    setIsEditing(false);
  };

  const updateItem = (index, field, value) => {
    const newConfig = [...editConfig];
    newConfig[index] = { 
      ...newConfig[index], 
      [field]: field === 'percent' ? (value === '' ? '' : Number(value)) : value 
    };
    setEditConfig(newConfig);
  };

  const totalPercent = editConfig.reduce((acc, curr) => acc + (Number(curr.percent) || 0), 0);
  const isValid = totalPercent === 100;
  
  const splitString = splitConfig.map(item => item.percent).join('/');

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
          className="relative bg-white dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-gray-800 rounded-xl shadow-[0_8px_24px_rgba(0,55,112,0.16)] p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Decorative Mesh Header */}
          <div 
            className="absolute top-0 left-0 w-full h-20"
            style={{
              background: 'linear-gradient(135deg, #1c1e54 0%, #0d253d 50%, #4434d4 100%)'
            }}
          />
          
          {!isEditing && (
            <button 
              type="button"
              onClick={() => setIsEditing(true)} 
              className="absolute top-3 left-3 btn-stripe-icon !w-7 !h-7 !bg-white/20 !border-white/30 text-white z-10"
              title="Edit Split"
            >
              <FaEdit size={12} />
            </button>
          )}

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

            <div className="text-center mb-5 relative">
              <h2 className="text-lg font-light text-[#0d253d] dark:text-white tracking-tight">
                Smart Income Split
              </h2>
              <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">
                {isEditing ? 'Customize your split categories' : `${splitString} Split`}
              </p>
              <p className="text-2xl font-light text-[#533afd] dark:text-[#665efd] mt-1 font-tnum">
                {formatCurrency(income.amount)}
              </p>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                {editConfig.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-white dark:bg-[#1c1e54] border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Category Name"
                      />
                      <div className="flex items-center gap-1 w-[70px] relative">
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          className="w-full bg-white dark:bg-[#1c1e54] border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-[#0d253d] dark:text-white text-right outline-none focus:border-[#533afd] transition-colors pr-5"
                          value={item.percent}
                          onChange={(e) => updateItem(index, 'percent', e.target.value)}
                        />
                        <span className="absolute right-2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                    <input 
                      className="w-full bg-white dark:bg-[#1c1e54] border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors"
                      value={item.subtitle}
                      onChange={(e) => updateItem(index, 'subtitle', e.target.value)}
                      placeholder="Subtitle (e.g. Food, Rent)"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between mt-4 px-1 text-xs">
                  <span className="text-[#64748d] dark:text-gray-400">Total Percentage:</span>
                  <span className={`font-semibold ${isValid ? 'text-[#059669]' : 'text-red-500'}`}>
                    {totalPercent}%
                  </span>
                </div>
                {!isValid && (
                  <p className="text-red-500 text-[10px] text-right px-1 mt-0.5">Total must equal exactly 100%</p>
                )}

                <div className="flex gap-2 mt-4">
                  <button 
                    type="button"
                    onClick={() => setEditConfig(DEFAULT_SPLIT)}
                    className="flex-1 py-2 text-xs font-normal border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Reset to Default
                  </button>
                  <button 
                    type="button"
                    disabled={!isValid}
                    onClick={handleSave}
                    className="flex-1 py-2 text-xs font-normal bg-[#533afd] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4434d4] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {splitConfig.map((item, index) => {
                  const colors = COLORS[index % COLORS.length];
                  const amount = income.amount * ((Number(item.percent) || 0) / 100);
                  return (
                    <div key={item.id} className={`flex justify-between items-center p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                      <div>
                        <p className={`font-normal ${colors.text} text-xs`}>{item.name} ({item.percent}%)</p>
                        <p className="text-[11px] text-[#64748d] dark:text-gray-400 font-normal">{item.subtitle}</p>
                      </div>
                      <span className={`font-normal ${colors.text} font-tnum text-sm`}>{formatCurrency(amount)}</span>
                    </div>
                  );
                })}

                <button 
                  type="button"
                  onClick={onClose}
                  className="btn-stripe-primary w-full mt-5 py-2.5 text-xs font-normal"
                >
                  Got it, thanks!
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncomeSuggestionModal;
