import React from 'react';
import { motion } from 'framer-motion';
import { FaUtensils, FaBus, FaWifi, FaGamepad, FaPiggyBank, FaTag, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

const categoryIcons = {
  'Food': FaUtensils,
  'Transport': FaBus,
  'Data/Airtime': FaWifi,
  'Entertainment': FaGamepad,
  'Savings/Invest': FaPiggyBank,
  'Other': FaTag,
};

const TransactionList = ({ transactions, onDelete }) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <FaTag className="text-4xl mb-2 opacity-20" />
        <p>No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {transactions.map((t, index) => {
        const Icon = categoryIcons[t.category] || FaTag;
        const isIncome = t.type === 'income';
        
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                <Icon className="text-sm" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{t.category}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {format(new Date(t.date), 'MMM d')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-gray-800'}`}>
                {isIncome ? '+' : '-'} ₵{t.amount.toFixed(2)}
              </span>
              {onDelete && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this?')) {
                      onDelete(t.id);
                    }
                  }}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors cursor-pointer relative z-10"
                  title="Delete Transaction"
                >
                  <FaTrash size={12} />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TransactionList;
