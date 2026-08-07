import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaEdit, FaCheck, FaUtensils, FaBus, FaWifi, FaGamepad, FaPiggyBank, FaTag, FaMoneyBillWave, FaGift, FaBriefcase, FaCalendarAlt, FaStickyNote } from 'react-icons/fa';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';

const categoryIcons = {
  'Food': FaUtensils,
  'Transport': FaBus,
  'Data/Airtime': FaWifi,
  'Entertainment': FaGamepad,
  'Savings/Invest': FaPiggyBank,
  'Allowance': FaMoneyBillWave,
  'Salary': FaBriefcase,
  'Gift': FaGift,
  'Other': FaTag,
};

const TransactionDetailsModal = ({ transaction, onClose, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(transaction ? transaction.amount : '');
  const [category, setCategory] = useState(transaction ? transaction.category : '');
  const [note, setNote] = useState(transaction ? transaction.note || '' : '');
  const [date, setDate] = useState(transaction ? transaction.date : '');

  if (!transaction) return null;

  const Icon = categoryIcons[transaction.category] || FaTag;
  const isIncome = transaction.type === 'income';

  const handleSaveEdit = async () => {
    if (!amount) return;
    if (onUpdate) {
      await onUpdate(transaction.id, {
        amount: parseFloat(amount),
        category,
        note,
        date
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0d253d]/50 backdrop-blur-sm pointer-events-auto"
        />
        
        {/* Modal Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-gray-800 rounded-xl shadow-[0_8px_24px_rgba(0,55,112,0.16)] p-6 pointer-events-auto relative overflow-hidden z-10"
        >
          {/* Top Bar Header */}
          <div className="flex justify-between items-center mb-5 border-b border-[#e3e8ee] dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isIncome ? 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]' : 'bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee]'
              }`}>
                <Icon size={14} />
              </div>
              <div>
                <h3 className="text-base font-light text-[#0d253d] dark:text-white tracking-tight">
                  {transaction.category}
                </h3>
                <span className={`inline-block text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isIncome 
                    ? 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]' 
                    : 'bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee]'
                }`}>
                  {transaction.type}
                </span>
              </div>
            </div>

            <button 
              type="button" 
              onClick={onClose} 
              className="btn-stripe-icon !w-8 !h-8"
            >
              <FaTimes size={13} />
            </button>
          </div>

          {/* Details Form / Display */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#64748d] dark:text-gray-300 mb-1">Amount (GH₵)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xl font-light font-tnum bg-[#f6f9fc] dark:bg-[#0b1329] border border-[#a8c3de] dark:border-gray-700 rounded-lg p-2.5 text-[#0d253d] dark:text-white outline-none focus:border-[#533afd]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#64748d] dark:text-gray-300 mb-1">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-tnum bg-[#f6f9fc] dark:bg-[#0b1329] border border-[#a8c3de] dark:border-gray-700 rounded-lg p-2 text-[#0d253d] dark:text-white outline-none focus:border-[#533afd]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#64748d] dark:text-gray-300 mb-1">Note</label>
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add note..."
                  className="w-full text-xs bg-[#f6f9fc] dark:bg-[#0b1329] border border-[#a8c3de] dark:border-gray-700 rounded-lg p-2 text-[#0d253d] dark:text-white outline-none focus:border-[#533afd]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-stripe-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="btn-stripe-primary flex-1 py-2 text-xs"
                >
                  <FaCheck size={11} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Amount Display */}
              <div className="text-center py-3 bg-[#f6f9fc] dark:bg-gray-800/40 rounded-xl border border-[#e3e8ee] dark:border-gray-700">
                <span className="text-[10px] uppercase text-[#64748d] dark:text-gray-400 font-normal tracking-wider block">
                  Transaction Amount
                </span>
                <p className={`text-3xl font-light font-tnum mt-1 ${
                  isIncome ? 'text-[#533afd] dark:text-[#665efd]' : 'text-[#0d253d] dark:text-white'
                }`}>
                  {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
              </div>

              {/* Info Rows */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f6f9fc] dark:bg-gray-800/30 border border-[#e3e8ee] dark:border-gray-700/60">
                  <div className="flex items-center gap-2 text-[#64748d] dark:text-gray-400">
                    <FaCalendarAlt size={12} />
                    <span>Date</span>
                  </div>
                  <span className="font-normal text-[#0d253d] dark:text-gray-200 font-tnum">
                    {format(new Date(transaction.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f6f9fc] dark:bg-gray-800/30 border border-[#e3e8ee] dark:border-gray-700/60">
                  <div className="flex items-center gap-2 text-[#64748d] dark:text-gray-400">
                    <FaTag size={12} />
                    <span>Category</span>
                  </div>
                  <span className="font-normal text-[#0d253d] dark:text-gray-200 font-tnum">
                    {transaction.category}
                  </span>
                </div>

                {transaction.note && (
                  <div className="flex items-start justify-between p-2.5 rounded-lg bg-[#f6f9fc] dark:bg-gray-800/30 border border-[#e3e8ee] dark:border-gray-700/60">
                    <div className="flex items-center gap-2 text-[#64748d] dark:text-gray-400 shrink-0">
                      <FaStickyNote size={12} />
                      <span>Note</span>
                    </div>
                    <span className="font-normal text-[#0d253d] dark:text-gray-200 text-right ml-4">
                      {transaction.note}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-stripe-secondary flex-1 py-2 text-xs"
                >
                  <FaEdit size={12} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-stripe-danger flex-1 py-2 text-xs"
                >
                  <FaTrash size={11} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionDetailsModal;
