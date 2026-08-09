import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaCalendarAlt, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaArrowDown, FaWallet, FaReceipt } from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

/**
 * Animated Balance Count-Up Counter
 */
const AnimatedBalance = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 600; // ms
    const startValue = displayValue;
    const endValue = Number(value || 0);

    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = startValue + (endValue - startValue) * progress;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
  }, [value]);

  return (
    <motion.span key={value} initial={{ scale: 1.05 }} animate={{ scale: 1 }}>
      {formatCurrency(displayValue)}
    </motion.span>
  );
};

/**
 * 1. CEDI CARD TILE (Hero Tile - lg:col-span-3 equal 50/50 split with Credit Score)
 */
export const CediCardTile = ({ balance, cardHolder = 'YOU', last4 = '1234', className = 'lg:col-span-3', isLoading = false }) => {
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="stripe-card p-6 h-full min-h-[200px] flex flex-col justify-between animate-pulse bg-[#1c1e54]/90 dark:bg-[#1c1e54]/90 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="w-10 h-7 rounded bg-white/20" />
            <div className="w-12 h-6 rounded-full bg-white/20" />
          </div>
          <div className="w-48 h-6 rounded bg-white/20 my-4" />
          <div className="flex justify-between items-end">
            <div className="w-20 h-4 rounded bg-white/20" />
            <div className="w-32 h-8 rounded bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,55,112,0.12)] text-white select-none border border-white/10 h-full min-h-[200px] flex flex-col justify-between"
      >
        {/* Stripe Brand Dark Navy to Deep Indigo Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1c1e54 0%, #0d253d 55%, #4434d4 100%)'
          }}
        />

        {/* Atmospheric Mesh Accents (Stripe Signature Ruby & Indigo Blurs) */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#ea2261]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#533afd]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Faint Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 8px)'
          }}
        />

        {/* Card Content */}
        <div className="relative z-10 p-6 flex flex-col justify-between h-full min-h-[200px]">
          {/* Top Row: EMV Metallic Chip + CEDI CARD Label + Stripe Brand Circles Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Silver/Indigo Chrome EMV Chip */}
              <div 
                className="relative w-10 h-7 rounded-sm border border-white/30 shadow-sm overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #e3e8ee 0%, #a8c3de 50%, #64748d 100%)'
                }}
              >
                <div className="absolute inset-[2px] rounded-[2px] border border-black/10 pointer-events-none" />
                <div className="absolute left-[3px] top-[2px] bottom-[2px] w-[8px] rounded-sm bg-black/10 border-r border-black/15" />
                <div className="absolute right-[3px] top-[2px] bottom-[2px] w-[10px] rounded-sm bg-black/5" />
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-black/20" />
              </div>

              {/* Watermark Label per DESIGN.md micro-cap */}
              <span className="text-[10px] font-normal uppercase tracking-[0.15em] text-white/60">
                CEDI CARD
              </span>
            </div>

            {/* Stripe Accent Overlapping Circles Card Logo */}
            <div className="flex items-center relative pr-1 opacity-95">
              <div className="w-6 h-6 rounded-full bg-[#533afd] shadow-sm" />
              <div className="w-6 h-6 rounded-full bg-[#ea2261] -ml-2.5 opacity-90 backdrop-blur-sm shadow-sm" />
            </div>
          </div>

          {/* Middle: Masked Card Number */}
          <div className="my-auto pt-2 pb-2">
            <div className="font-mono text-base md:text-lg tracking-[0.2em] text-white/90 font-normal drop-shadow-sm flex items-center gap-3 font-tnum">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span>{last4}</span>
            </div>
          </div>

          {/* Bottom Row: Card Holder & Visual Focal Point (Balance with Count-Up Animation) */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1px] font-normal text-white/50 mb-0.5">
                CARD HOLDER
              </p>
              <p className="text-xs font-normal text-white/90 tracking-wide uppercase">
                {cardHolder}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.1px] font-normal text-white/50 mb-0.5">
                BALANCE
              </p>
              <p className="text-2xl md:text-3xl font-light text-white tracking-tight font-tnum">
                <AnimatedBalance value={balance} />
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 2. CREDIT SCORE TILE (Persistent Bento Tile with Skeleton Support)
 */
export const CreditScoreTile = ({ creditScore, className = 'lg:col-span-3', isLoading = false }) => {
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="stripe-card p-5 h-full flex flex-col justify-between animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
              <div className="w-20 h-3 bg-[#e3e8ee] dark:bg-gray-700/70 rounded" />
              <div className="w-28 h-8 bg-[#e3e8ee] dark:bg-gray-700/70 rounded" />
            </div>
            <div className="w-9 h-9 rounded-full bg-[#e3e8ee] dark:bg-gray-700/70" />
          </div>
          <div className="w-full bg-[#e3e8ee] dark:bg-gray-700/70 h-2 rounded-full mb-3" />
          <div className="flex items-center justify-between pt-2 border-t border-[#e3e8ee] dark:border-gray-800">
            <div className="w-24 h-3 bg-[#e3e8ee] dark:bg-gray-700/70 rounded" />
            <div className="w-20 h-3 bg-[#e3e8ee] dark:bg-gray-700/70 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const getScoreColorConfig = (score) => {
    if (score >= 650) {
      return {
        text: 'text-[#533afd] dark:text-[#665efd]',
        bg: 'bg-[#533afd]',
        badgeBg: 'bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd]',
        label: 'Excellent Health'
      };
    }
    if (score >= 550) {
      return {
        text: 'text-[#9b6829] dark:text-[#fde68a]',
        bg: 'bg-[#9b6829]',
        badgeBg: 'bg-[#9b6829]/10 text-[#9b6829] dark:bg-[#9b6829]/20 dark:text-[#fde68a]',
        label: 'Fair Health'
      };
    }
    return {
      text: 'text-[#ea2261] dark:text-[#f96bee]',
      bg: 'bg-[#ea2261]',
      badgeBg: 'bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee]',
      label: 'Needs Work'
    };
  };

  const scoreConfig = getScoreColorConfig(creditScore);

  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="stripe-card p-5 h-full flex flex-col justify-between relative overflow-hidden"
      >
        <div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] text-[#64748d] dark:text-gray-400 font-normal uppercase tracking-wider block">Credit Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className={`text-3xl font-light font-tnum ${scoreConfig.text}`}>
                  {creditScore}
                </h3>
                <span className="text-xs text-[#64748d] dark:text-gray-400 font-normal font-tnum">/ 850</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-full ${scoreConfig.badgeBg}`}>
              <FaShieldAlt size={15} />
            </div>
          </div>

          {/* Progress bar with Stripe Semantic Tokens */}
          <div className="w-full bg-[#e3e8ee] dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${scoreConfig.bg}`} 
              style={{ width: `${Math.min(100, (creditScore / 850) * 100)}%` }}
            />
          </div>
        </div>

        {/* Supporting Details */}
        <div className="flex items-center justify-between text-[11px] text-[#64748d] dark:text-gray-400 pt-2 border-t border-[#e3e8ee] dark:border-gray-800 mt-auto">
          <span className={`font-normal ${scoreConfig.text}`}>
            {scoreConfig.label}
          </span>
          <span className="flex items-center gap-1 font-tnum">
            <FaCalendarAlt size={10} />
            <span>Updated today</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 3. ADD TRANSACTION TILE (Dashboard Bento Tile)
 */
export const AddTransactionTile = ({ onAddClick, className = 'lg:col-span-2' }) => {
  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="stripe-card-interactive p-5 h-full flex items-center justify-between group"
        onClick={onAddClick}
      >
        <div className="space-y-0.5">
          <h4 className="text-sm font-normal text-[#0d253d] dark:text-white group-hover:text-[#533afd] transition-colors">
            Add New Transaction
          </h4>
          <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">
            Log an expense or income
          </p>
        </div>

        <div className="btn-stripe-primary p-2.5 group-hover:scale-105 transition-transform flex-shrink-0">
          <FaPlus size={13} />
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 4. TOTAL INCOME TILE (lg:col-span-2)
 */
export const TotalIncomeTile = ({ totalIncome, className = 'lg:col-span-2' }) => {
  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stripe-card p-5 h-full flex flex-col justify-between bg-[#533afd]/5 dark:bg-[#533afd]/15 border border-[#533afd]/20"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#533afd] dark:text-[#665efd] font-normal uppercase tracking-wider">
            Total Income
          </span>
          <div className="w-7 h-7 rounded-full bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd] flex items-center justify-center">
            <FaWallet size={12} />
          </div>
        </div>
        <p className="text-2xl font-light font-tnum text-[#533afd] dark:text-[#665efd] tracking-tight">
          {formatCurrency(totalIncome)}
        </p>
      </motion.div>
    </div>
  );
};

/**
 * 5. TOTAL EXPENSES TILE (lg:col-span-2)
 */
export const TotalExpensesTile = ({ totalExpenses, className = 'lg:col-span-2' }) => {
  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stripe-card p-5 h-full flex flex-col justify-between bg-[#ea2261]/5 dark:bg-[#ea2261]/15 border border-[#ea2261]/20"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#ea2261] dark:text-[#f96bee] font-normal uppercase tracking-wider">
            Total Expenses
          </span>
          <div className="w-7 h-7 rounded-full bg-[#ea2261]/10 text-[#ea2261] dark:bg-[#ea2261]/20 dark:text-[#f96bee] flex items-center justify-center">
            <FaReceipt size={12} />
          </div>
        </div>
        <p className="text-2xl font-light font-tnum text-[#ea2261] dark:text-[#f96bee] tracking-tight">
          {formatCurrency(totalExpenses)}
        </p>
      </motion.div>
    </div>
  );
};

/**
 * 6. LOW FUNDS BANNER TILE (Full width - lg:col-span-6)
 */
export const LowFundsBannerTile = ({ balance, creditScore, transactions = [], className = 'lg:col-span-6' }) => {
  const getAdviceConfig = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysExpenses = transactions
      .filter(t => t.date === today && t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    if (balance < 0) {
      return {
        text: "Critical: You are in debt. Stop spending immediately!",
        bg: "bg-[#fff1f2] dark:bg-[#4c0519]/50",
        border: "border-[#fecdd3] dark:border-[#9f1239]",
        textCol: "text-[#e11d48] dark:text-[#fda4af]",
        icon: FaExclamationTriangle
      };
    }
    if (balance < 50) {
      return {
        text: "Low funds warning. Only essential spending recommended.",
        bg: "bg-[#f5e9d4] dark:bg-[#451a03]/60",
        border: "border-[#e3e8ee] dark:border-[#78350f]",
        textCol: "text-[#9b6829] dark:text-[#fde68a]",
        icon: FaExclamationTriangle
      };
    }
    if (todaysExpenses > 300) {
      return {
        text: "High spending recorded today. Try to slow down.",
        bg: "bg-[#fefce8] dark:bg-[#422006]/50",
        border: "border-[#fef08a] dark:border-[#854d0e]",
        textCol: "text-[#854d0e] dark:text-[#fef08a]",
        icon: FaArrowDown
      };
    }
    if (creditScore < 550) {
      return {
        text: "Credit score needs work. Reduce spending to rebuild.",
        bg: "bg-[#fff1f2] dark:bg-[#4c0519]/40",
        border: "border-[#fecdd3] dark:border-[#9f1239]",
        textCol: "text-[#ea2261] dark:text-[#fda4af]",
        icon: FaShieldAlt
      };
    }
    if (creditScore >= 750 && balance > 500) {
      return {
        text: "Excellent financial health! Safe to spend responsibly.",
        bg: "bg-[#f0fdf4] dark:bg-[#064e3b]/40",
        border: "border-[#bbf7d0] dark:border-[#047857]",
        textCol: "text-[#059669] dark:text-[#6ee7b7]",
        icon: FaCheckCircle
      };
    }
    
    return {
      text: "Spend wisely. Every Cedi counts towards your savings.",
      bg: "bg-[#f6f9fc] dark:bg-[#1c1e54]/50",
      border: "border-[#e3e8ee] dark:border-[#273951]",
      textCol: "text-[#0d253d] dark:text-[#a8c3de]",
      icon: FaInfoCircle
    };
  };

  const advice = getAdviceConfig();
  const AdviceIcon = advice.icon;

  return (
    <div className={`w-full ${className}`}>
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${advice.bg} ${advice.border} transition-all`}>
        <AdviceIcon className={`text-base flex-shrink-0 ${advice.textCol}`} />
        <p className={`text-xs font-normal leading-snug ${advice.textCol}`}>
          {advice.text}
        </p>
      </div>
    </div>
  );
};

// Legacy Default export fallback for compatibility
const Dashboard = ({ balance, creditScore, transactions, onAddClick, cardHolder }) => {
  return (
    <div className="space-y-4">
      <CediCardTile balance={balance} cardHolder={cardHolder} className="w-full" />
      <LowFundsBannerTile balance={balance} creditScore={creditScore} transactions={transactions} className="w-full" />
    </div>
  );
};

export const DashboardSidebarWidgets = ({ creditScore, onAddClick }) => {
  return (
    <div className="space-y-4">
      <CreditScoreTile creditScore={creditScore} className="w-full" />
      <AddTransactionTile onAddClick={onAddClick} className="w-full" />
    </div>
  );
};

export default Dashboard;
