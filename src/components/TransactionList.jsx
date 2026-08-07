import React from 'react';
import { motion } from 'framer-motion';
import { FaUtensils, FaBus, FaWifi, FaGamepad, FaPiggyBank, FaTag, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';

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
      <div className="stripe-card flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[#f6f9fc] dark:bg-gray-800 text-[#64748d] flex items-center justify-center mb-3 border border-[#e3e8ee] dark:border-gray-700">
          <FaTag className="text-lg opacity-60" />
        </div>
        <p className="text-sm font-normal text-[#0d253d] dark:text-gray-200 mb-1">No transactions recorded yet</p>
        <p className="text-xs text-[#64748d] dark:text-gray-400">Click "Add New Transaction" above to start logging.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Stacked View (< lg) */}
      <div className="space-y-2.5 pb-6 lg:hidden">
        {transactions.map((t, index) => {
          const Icon = categoryIcons[t.category] || FaTag;
          const isIncome = t.type === 'income';
          
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="stripe-card p-3.5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isIncome ? 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]' : 'bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee]'
                }`}>
                  <Icon className="text-xs" />
                </div>
                <div>
                  <p className="font-normal text-[#0d253d] dark:text-gray-100 text-sm">{t.category}</p>
                  <p className="text-[11px] text-[#64748d] dark:text-gray-400 font-normal font-tnum">
                    {format(new Date(t.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`font-normal text-sm font-tnum ${isIncome ? 'text-[#533afd] dark:text-[#665efd]' : 'text-[#0d253d] dark:text-gray-100'}`}>
                  {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
                {onDelete && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this transaction?')) {
                        onDelete(t.id);
                      }
                    }}
                    className="p-1.5 text-[#64748d] hover:text-[#ea2261] dark:hover:text-[#f96bee] transition-colors cursor-pointer"
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

      {/* Desktop Structured Table View (>= lg) */}
      <div className="hidden lg:block stripe-card overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#e3e8ee] dark:border-gray-800 bg-[#f6f9fc] dark:bg-gray-900/60 text-[#64748d] dark:text-gray-400 text-[11px] uppercase tracking-wider font-normal">
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee] dark:divide-gray-800">
            {transactions.map((t, index) => {
              const Icon = categoryIcons[t.category] || FaTag;
              const isIncome = t.type === 'income';

              return (
                <motion.tr 
                  key={t.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-[#f6f9fc]/80 dark:hover:bg-gray-800/40 transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isIncome ? 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]' : 'bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee]'
                      }`}>
                        <Icon className="text-xs" />
                      </div>
                      <span className="font-normal text-[#0d253d] dark:text-gray-100">{t.category}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-[#64748d] dark:text-gray-400 text-xs font-normal font-tnum">
                    {format(new Date(t.date), 'MMM d, yyyy')}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-normal uppercase tracking-wider ${
                      isIncome 
                        ? 'bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 dark:bg-[#533afd]/20 dark:text-[#665efd]' 
                        : 'bg-[#ea2261]/10 text-[#ea2261] border border-[#ea2261]/20 dark:bg-[#ea2261]/20 dark:text-[#f96bee]'
                    }`}>
                      {t.type}
                    </span>
                  </td>

                  <td className={`py-3 px-4 text-right font-normal font-tnum ${isIncome ? 'text-[#533afd] dark:text-[#665efd]' : 'text-[#0d253d] dark:text-gray-100'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {onDelete && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this transaction?')) {
                            onDelete(t.id);
                          }
                        }}
                        className="p-1.5 rounded-full text-[#64748d] hover:text-[#ea2261] hover:bg-[#ea2261]/10 transition-colors cursor-pointer"
                        title="Delete Transaction"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TransactionList;
