import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUtensils, FaBus, FaWifi, FaGamepad, FaPiggyBank, FaTag, FaTrash, FaMoneyBillWave, FaGift, FaBriefcase, FaInbox, FaWallet, FaReceipt, FaRedo } from 'react-icons/fa';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import TransactionDetailsModal from './TransactionDetailsModal';

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

const TransactionList = ({ transactions, onDelete, onUpdate, isLoading = false, filterType = 'all' }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="stripe-card p-4 space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[#e3e8ee] dark:border-gray-800 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e3e8ee] dark:bg-gray-700/70 shrink-0" />
              <div className="space-y-1.5">
                <div className="w-24 h-3 bg-[#e3e8ee] dark:bg-gray-700/70 rounded" />
                <div className="w-16 h-2 bg-[#e3e8ee] dark:bg-gray-700/70 rounded" />
              </div>
            </div>
            <div className="w-20 h-4 bg-[#e3e8ee] dark:bg-gray-700/70 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Empty State Handling (Contextual based on filter type)
  if (transactions.length === 0) {
    const getEmptyStateContent = () => {
      if (filterType === 'expense') {
        return {
          icon: FaReceipt,
          title: "No Expense Transactions Found",
          subtitle: "You haven't recorded any expenses under this view yet."
        };
      }
      if (filterType === 'income') {
        return {
          icon: FaWallet,
          title: "No Income Transactions Found",
          subtitle: "You haven't recorded any income entries yet."
        };
      }
      return {
        icon: FaInbox,
        title: "No Transactions Recorded Yet",
        subtitle: "Click 'Add New Transaction' above to start logging your cash flow."
      };
    };

    const emptyContent = getEmptyStateContent();
    const EmptyIcon = emptyContent.icon;

    return (
      <div className="stripe-card flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#f6f9fc] dark:bg-gray-800 text-[#533afd] flex items-center justify-center border border-[#e3e8ee] dark:border-gray-700 shadow-sm">
          <EmptyIcon className="text-lg opacity-80" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-sm font-light text-[#0d253d] dark:text-white tracking-tight">{emptyContent.title}</h3>
          <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal leading-relaxed">{emptyContent.subtitle}</p>
        </div>
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
              onClick={() => setSelectedTransaction(t)}
              className="stripe-card-interactive p-3.5 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isIncome ? 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]' : 'bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee]'
                }`}>
                  <Icon className="text-xs" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-normal text-[#0d253d] dark:text-gray-100 text-sm group-hover:text-[#533afd] transition-colors">{t.category}</p>
                    {t.isRecurring && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-normal bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]" title="Recurring Monthly">
                        <FaRedo size={7} /> Monthly
                      </span>
                    )}
                  </div>
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
                  onClick={() => setSelectedTransaction(t)}
                  className="hover:bg-[#f6f9fc] dark:hover:bg-gray-800/60 transition-colors group cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isIncome ? 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]' : 'bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee]'
                      }`}>
                        <Icon className="text-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-normal text-[#0d253d] dark:text-gray-100 group-hover:text-[#533afd] transition-colors">{t.category}</span>
                        {t.isRecurring && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]" title="Recurring Monthly">
                            <FaRedo size={8} /> Monthly
                          </span>
                        )}
                      </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
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

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default TransactionList;
