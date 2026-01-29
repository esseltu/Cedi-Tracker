import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUtensils, FaBus, FaWifi, FaGamepad, FaPiggyBank, FaTag, FaTimes, FaMoneyBillWave, FaGift, FaBriefcase } from 'react-icons/fa';

const expenseCategories = [
  { id: 'Food', label: 'Food', icon: FaUtensils, color: 'text-orange-500' },
  { id: 'Transport', label: 'Transport', icon: FaBus, color: 'text-blue-500' },
  { id: 'Data/Airtime', label: 'Data/Airtime', icon: FaWifi, color: 'text-sky-500' },
  { id: 'Entertainment', label: 'Entertainment', icon: FaGamepad, color: 'text-purple-500' },
  { id: 'Savings/Invest', label: 'Savings/Invest', icon: FaPiggyBank, color: 'text-emerald-500' },
  { id: 'Other', label: 'Other', icon: FaTag, color: 'text-gray-500' },
];

const incomeCategories = [
  { id: 'Allowance', label: 'Allowance', icon: FaMoneyBillWave, color: 'text-emerald-500' },
  { id: 'Salary', label: 'Salary', icon: FaBriefcase, color: 'text-blue-500' },
  { id: 'Gift', label: 'Gift', icon: FaGift, color: 'text-purple-500' },
  { id: 'Other', label: 'Other', icon: FaTag, color: 'text-gray-500' },
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
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category,
      note,
      date,
      type: type // 'expense' or 'income'
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
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full sm:w-96 bg-white/80 backdrop-blur-xl border-t border-white/50 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 pointer-events-auto pb-6 sm:pb-6 m-0 sm:m-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">New Transaction</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <FaTimes className="text-gray-500 text-sm" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Type Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory(expenseCategories[0].id); }}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory(incomeCategories[0].id); }}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    type === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₵)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-2xl font-bold bg-transparent border-b-2 border-gray-200 focus:border-emerald-500 outline-none py-1 px-1 text-gray-800 placeholder:text-gray-300 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                        category === cat.id 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                          : 'bg-white/40 border-transparent hover:bg-white/60 text-gray-500'
                      }`}
                    >
                      <cat.icon className={`text-lg mb-1 ${category === cat.id ? 'text-emerald-600' : cat.color}`} />
                      <span className="text-[10px] font-medium truncate w-full text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input w-full py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note (Optional)</label>
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was this for?"
                  className="glass-input w-full py-2 text-sm"
                />
              </div>

              <button 
                type="submit" 
                className="w-full glass-button py-3 text-base font-bold mt-2 bg-emerald-500 hover:bg-emerald-600"
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
