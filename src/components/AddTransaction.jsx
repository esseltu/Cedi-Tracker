import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUtensils, FaBus, FaWifi, FaGamepad, FaPiggyBank, FaTag, FaTimes, FaMoneyBillWave, FaGift, FaBriefcase } from 'react-icons/fa';

const expenseCategories = [
  { id: 'Food', label: 'Food', icon: FaUtensils, color: 'text-amber-500' },
  { id: 'Transport', label: 'Transport', icon: FaBus, color: 'text-sky-500' },
  { id: 'Data/Airtime', label: 'Data/Airtime', icon: FaWifi, color: 'text-[#533afd]' },
  { id: 'Entertainment', label: 'Entertainment', icon: FaGamepad, color: 'text-[#f96bee]' },
  { id: 'Savings/Invest', label: 'Savings/Invest', icon: FaPiggyBank, color: 'text-[#059669]' },
  { id: 'Other', label: 'Other', icon: FaTag, color: 'text-[#64748d]' },
];

const incomeCategories = [
  { id: 'Allowance', label: 'Allowance', icon: FaMoneyBillWave, color: 'text-[#059669]' },
  { id: 'Salary', label: 'Salary', icon: FaBriefcase, color: 'text-[#533afd]' },
  { id: 'Gift', label: 'Gift', icon: FaGift, color: 'text-[#f96bee]' },
  { id: 'Other', label: 'Other', icon: FaTag, color: 'text-[#64748d]' },
];

const AddTransaction = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0].id);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;

    onAdd({
      amount: parseFloat(amount),
      category,
      note,
      date,
      type: type
    });
    
    // Reset and close
    setAmount('');
    setNote('');
    setType('expense');
    setCategory(expenseCategories[0].id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0d253d]/50 backdrop-blur-sm pointer-events-auto"
          />
          
          {/* Modal Container - DESIGN.md Card Surface & Elevation */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="w-full sm:w-[420px] bg-white dark:bg-[#1c1e54] border-t sm:border border-[#e3e8ee] dark:border-gray-800 rounded-t-2xl sm:rounded-xl shadow-[0_8px_24px_rgba(0,55,112,0.16)] p-6 pointer-events-auto relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-light text-[#0d253d] dark:text-white tracking-tight">New Transaction</h2>
                <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">Record your cash flow</p>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="btn-stripe-icon !w-8 !h-8"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Expense / Income Segmented Control Toggle */}
              <div className="flex p-1 bg-[#f6f9fc] dark:bg-gray-800/80 rounded-full border border-[#e3e8ee] dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory(expenseCategories[0].id); }}
                  className={`flex-1 py-1.5 text-xs font-normal rounded-full transition-all cursor-pointer ${
                    type === 'expense' 
                      ? 'bg-[#ea2261] text-white shadow-sm font-medium' 
                      : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory(incomeCategories[0].id); }}
                  className={`flex-1 py-1.5 text-xs font-normal rounded-full transition-all cursor-pointer ${
                    type === 'income' 
                      ? 'bg-[#533afd] text-white shadow-sm font-medium' 
                      : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-normal text-[#64748d] dark:text-gray-300 mb-1">
                  Amount (GH₵)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-2xl font-light font-tnum bg-[#f6f9fc] dark:bg-[#0b1329] border border-[#a8c3de] dark:border-gray-700 focus:border-[#533afd] focus:ring-2 focus:ring-[#533afd]/20 outline-none rounded-lg py-2.5 px-3 text-[#0d253d] dark:text-white placeholder:text-[#64748d]/40 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Category Tiles */}
              <div>
                <label className="block text-xs font-normal text-[#64748d] dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#533afd]/10 border-[#533afd] text-[#533afd] dark:text-[#665efd] dark:border-[#533afd] shadow-sm' 
                            : 'bg-[#f6f9fc] dark:bg-gray-800/40 border-[#e3e8ee] dark:border-gray-700/60 text-[#64748d] dark:text-gray-400 hover:bg-[#e3e8ee]/40'
                        }`}
                      >
                        <cat.icon className={`text-base mb-1 ${isSelected ? 'text-[#533afd] dark:text-[#665efd]' : cat.color}`} />
                        <span className="text-[11px] font-normal truncate w-full text-center font-tnum">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-normal text-[#64748d] dark:text-gray-300 mb-1">
                  Date
                </label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-normal font-tnum bg-[#f6f9fc] dark:bg-[#0b1329] border border-[#a8c3de] dark:border-gray-700 focus:border-[#533afd] focus:ring-2 focus:ring-[#533afd]/20 outline-none rounded-lg py-2 px-3 text-[#0d253d] dark:text-white transition-all"
                />
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-xs font-normal text-[#64748d] dark:text-gray-300 mb-1">
                  Note (Optional)
                </label>
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was this for?"
                  className="w-full text-xs font-normal bg-[#f6f9fc] dark:bg-[#0b1329] border border-[#a8c3de] dark:border-gray-700 focus:border-[#533afd] focus:ring-2 focus:ring-[#533afd]/20 outline-none rounded-lg py-2 px-3 text-[#0d253d] dark:text-white placeholder:text-[#64748d]/40 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-stripe-primary w-full py-3 text-sm font-normal mt-3 !rounded-full shadow-sm"
              >
                Add Transaction
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransaction;
