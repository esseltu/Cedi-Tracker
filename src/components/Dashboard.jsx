import React from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaWallet } from 'react-icons/fa';
import CreditScoreGauge from './CreditScoreGauge';
import { formatCurrency } from '../utils/currency';

const Dashboard = ({ balance, creditScore, transactions = [], onAddClick }) => {
  const getAdvice = () => {
    // 1. Check Today's Spending
    const today = new Date().toISOString().split('T')[0];
    const todaysExpenses = transactions
      .filter(t => t.date === today && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Logic Hierarchy
    if (balance < 0) return "🛑 Critical: You are in debt. Stop spending immediately!";
    if (balance < 50) return "⚠️ Low funds. Only essential spending recommended.";
    if (todaysExpenses > 300) return "📉 High spending today. Try to slow down.";
    if (creditScore < 550) return "🛑 Credit score needs work. Reduce spending to rebuild.";
    if (creditScore >= 750 && balance > 500) return "✅ Excellent health! Safe to spend responsibly.";
    if (balance > 200) return "💡 Safe to spend, but keep saving.";
    
    return "ℹ️ Spend wisely. Every Cedi counts.";
  };

  return (
    <div className="space-y-6">
      {/* Balance Card - ATM style */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-2xl shadow-xl text-white"
      >
        {/* Background gradient and textures */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800" />
        <div className="absolute -top-8 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-72 h-72 bg-black/10 dark:bg-black/20 rounded-full blur-3xl" />

        {/* Subtle diagonal stripes */}
        <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
             style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 2px, transparent 2px, transparent 6px)' }} />

        {/* Card content */}
        <div className="relative z-10 p-5">
          {/* Top row: brand + contactless */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-500 border border-white/35 shadow-[0_10px_18px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.55)] overflow-hidden">
                <div className="absolute -inset-4 bg-gradient-to-r from-white/45 via-white/0 to-black/15 rotate-12 opacity-80" />
                <div className="absolute inset-[2px] rounded-[7px] border border-black/10" />

                <div className="absolute left-[3px] top-[3px] bottom-[3px] w-[9px] rounded-sm bg-white/28 border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
                <div className="absolute left-[14px] top-[3px] right-[3px] h-[9px] rounded-sm bg-white/22 border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.30)]" />
                <div className="absolute left-[14px] bottom-[3px] right-[3px] h-[9px] rounded-sm bg-white/18 border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" />

                <div className="absolute left-[12px] top-[3px] bottom-[3px] w-px bg-black/10" />
                <div className="absolute left-[14px] right-[3px] top-1/2 h-px bg-black/10" />
              </div>
              <span className="text-xs uppercase tracking-widest text-white/80">Cedi Card</span>
            </div>
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
              <FaWallet className="text-white/90" />
            </div>
          </div>

          {/* Middle: masked number */}
          <div className="mt-6 font-mono tracking-widest text-lg">
            <span className="inline-block mr-2">****</span>
            <span className="inline-block mr-2">****</span>
            <span className="inline-block mr-2">****</span>
            <span className="inline-block">1234</span>
          </div>

          {/* Bottom row: holder + balance */}
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/60">Card Holder</p>
              <p className="text-sm font-semibold">You</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/60">Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Small advisory text under the card */}
      <p className="text-[11px] text-gray-600 dark:text-gray-400 px-1 -mt-1">
        {getAdvice()}
      </p>

      {/* Actions & Score */}
      <div className="grid grid-cols-2 gap-4">
        {/* Credit Score - Redesigned */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 flex flex-col justify-between relative overflow-hidden h-32"
        >
          <div className="z-10">
             <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Credit Score</span>
             <h3 className={`text-2xl font-bold ${creditScore >= 650 ? 'text-emerald-600' : creditScore >= 550 ? 'text-yellow-600' : 'text-red-500'}`}>{creditScore}</h3>
             <p className="text-[10px] text-gray-400 font-medium">{creditScore >= 750 ? 'Excellent' : creditScore >= 550 ? 'Fair' : 'Needs Work'}</p>
          </div>
          
          {/* Decorative mini-gauge or bar */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-auto overflow-hidden">
             <div 
               className={`h-full rounded-full ${creditScore >= 650 ? 'bg-emerald-500' : creditScore >= 550 ? 'bg-yellow-500' : 'bg-red-500'}`} 
               style={{ width: `${Math.min(100, (creditScore/850)*100)}%` }}
             ></div>
          </div>
        </motion.div>

        {/* Quick Add Button - Redesigned */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/60 transition-colors h-32 relative overflow-hidden group"
          onClick={onAddClick}
        >
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 shadow-sm group-hover:scale-110 transition-transform">
            <FaPlus className="text-xl" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Add New</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
