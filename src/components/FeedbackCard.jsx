import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FaChartPie, FaLightbulb, FaInfoCircle, FaWallet, FaPiggyBank, FaCoins } from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

const COLORS = {
  'Food': '#f97316', // Orange
  'Transport': '#533afd', // Stripe Primary Indigo
  'Data/Airtime': '#0ea5e9', // Sky Blue
  'Entertainment': '#f96bee', // Stripe Magenta
  'Savings/Invest': '#059669', // Emerald
  'Other': '#64748d', // Stripe Mute Gray
};

export const useInsightsAnalysis = (transactions = [], balance = 0) => {
  return useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');

    const totalSpent = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalIncome = incomes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    // Category breakdown
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

    const chartData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    // Generate Advice
    const advice = [];
    const foodSpent = categoryTotals['Food'] || 0;
    const transportSpent = categoryTotals['Transport'] || 0;
    const entertainmentSpent = categoryTotals['Entertainment'] || 0;

    if (totalSpent > 0) {
      if (foodSpent / totalSpent > 0.4) {
        advice.push("Spending high on Food (>40%). Consider meal planning or budget dining.");
      }
      if (transportSpent / totalSpent > 0.3) {
        advice.push("Transport takes >30% of expenses. Combine trips where possible.");
      }
      if (entertainmentSpent / totalSpent > 0.15) {
        advice.push("Entertainment is above 15%. Trim leisure spending to boost savings.");
      }
    } else if (totalIncome > 0) {
      advice.push(`Great start! You've logged ${formatCurrency(totalIncome)} in income. Allocate 20% to savings.`);
    }

    if (balance < 100 && balance > 0) {
      advice.push(`Balance is low! Reserve at least ${formatCurrency(200)} for emergencies.`);
    }

    // Request Suggestion
    let requestSuggestion = null;
    if (balance < 150 && balance > 0) {
      requestSuggestion = `Consider topping up your balance with ${formatCurrency(400)} for upcoming expenses.`;
    }

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || null;
    const topCategoryName = topCategory ? topCategory[0] : null;
    const topCategoryValue = topCategory ? topCategory[1] : 0;
    const topCategoryPct = totalSpent > 0 ? Math.round((topCategoryValue / totalSpent) * 100) : 0;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    const dailyCap = balance > 0 ? balance / daysLeft : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysExpenses = expenses
      .filter(t => t.date === todayStr)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const todayPct = dailyCap > 0 ? Math.min(100, Math.round((todaysExpenses / dailyCap) * 100)) : 0;

    const savingsTxs = transactions.filter(t => t.type === 'expense' && t.category === 'Savings/Invest');
    const lastSavingsTx = savingsTxs
      .slice()
      .sort((a, b) => {
        if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
        if (a.createdAt && b.createdAt) return b.createdAt.toMillis() - a.createdAt.toMillis();
        return 0;
      })[0];

    // Stripe Semantic Health Status Tokens
    const health =
      balance < 0
        ? { label: 'Debt Alert', className: 'bg-[#ea2261]/10 text-[#ea2261] border-[#ea2261]/30 dark:bg-[#ea2261]/20 dark:text-[#f96bee]' }
        : dailyCap > 0 && todaysExpenses > dailyCap
        ? { label: 'Over Daily Cap', className: 'bg-[#ea2261]/10 text-[#ea2261] border-[#ea2261]/30 dark:bg-[#ea2261]/20 dark:text-[#f96bee]' }
        : balance < 100
        ? { label: 'Caution', className: 'bg-[#9b6829]/10 text-[#9b6829] border-[#9b6829]/30 dark:bg-[#9b6829]/20 dark:text-[#fde68a]' }
        : { label: 'On Track', className: 'bg-[#533afd]/10 text-[#533afd] border-[#533afd]/30 dark:bg-[#533afd]/20 dark:text-[#665efd]' };

    if (dailyCap > 0 && todaysExpenses > dailyCap) {
      advice.unshift("Today's spending exceeded your calculated daily cap.");
    }

    return { totalSpent, totalIncome, chartData, advice, requestSuggestion, topCategoryName, topCategoryValue, topCategoryPct, dailyCap, todaysExpenses, todayPct, lastSavingsTx, health };
  }, [transactions, balance]);
};

/**
 * SPENDING BREAKDOWN BENTO TILE (lg:col-span-3)
 */
export const SpendingBreakdownTile = ({ analysis, className = 'lg:col-span-3' }) => {
  if (analysis.totalSpent > 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="stripe-card p-6 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-light text-[#0d253d] dark:text-white tracking-tight">Spending Breakdown</h3>
            <span className="text-xs text-[#64748d] dark:text-gray-400 font-normal font-tnum">
              {analysis.chartData.length} Categories
            </span>
          </div>

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analysis.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analysis.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Other']} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0d253d',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#64748d] dark:text-gray-400 font-normal block">
                  Total Spent
                </span>
                <p className="text-lg font-light text-[#0d253d] dark:text-white font-tnum">
                  {formatCurrency(analysis.totalSpent)}
                </p>
              </div>
            </div>
          </div>

          {/* Category Legend Grid */}
          <div className="mt-3 pt-3 border-t border-[#e3e8ee] dark:border-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {analysis.chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[item.name] || COLORS['Other'] }} />
                <div className="truncate">
                  <span className="text-[#64748d] dark:text-gray-400 font-normal block text-[11px] truncate">{item.name}</span>
                  <span className="font-normal font-tnum text-[#0d253d] dark:text-white">{formatCurrency(Number(item.value))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="stripe-card p-6 h-full flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#533afd]/10 text-[#533afd] flex items-center justify-center shrink-0">
          <FaWallet size={16} />
        </div>
        <div>
          <h4 className="text-sm font-normal text-[#0d253d] dark:text-white">Income Logged</h4>
          <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal mt-0.5">
            You have logged <strong className="text-[#533afd] font-tnum">{formatCurrency(analysis.totalIncome)}</strong> in income with 0 expenses. Add an expense to view category breakdowns.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * DAILY CAP BENTO TILE (lg:col-span-3)
 */
export const DailyCapTile = ({ dailyCap, className = 'lg:col-span-3' }) => {
  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="stripe-card p-5 h-full flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#64748d] dark:text-gray-400 font-normal uppercase tracking-wider block">Daily Budget Cap</span>
          <div className="w-7 h-7 rounded-full bg-[#533afd]/10 text-[#533afd] dark:bg-[#533afd]/20 dark:text-[#665efd] flex items-center justify-center">
            <FaCoins size={12} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-light font-tnum text-[#0d253d] dark:text-white mt-1">
            {dailyCap > 0 ? formatCurrency(dailyCap) : '—'}
          </p>
          <p className="text-[11px] text-[#64748d] dark:text-gray-400 font-normal mt-1">
            Calculated daily safe spending limit
          </p>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * LAST SAVED BENTO TILE (lg:col-span-3)
 */
export const LastSavedTile = ({ lastSavingsTx, className = 'lg:col-span-3' }) => {
  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="stripe-card p-5 h-full flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#64748d] dark:text-gray-400 font-normal uppercase tracking-wider block">Last Saved</span>
          <div className="w-7 h-7 rounded-full bg-[#059669]/10 text-[#059669] dark:bg-[#059669]/20 dark:text-[#34d399] flex items-center justify-center">
            <FaPiggyBank size={12} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-light font-tnum text-[#059669] dark:text-[#34d399] mt-1">
            {lastSavingsTx ? formatCurrency(lastSavingsTx.amount) : '—'}
          </p>
          <p className="text-[11px] text-[#64748d] dark:text-gray-400 font-normal mt-1 truncate">
            {lastSavingsTx ? `Logged on ${lastSavingsTx.date}` : 'No savings logged yet'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * SMART GUIDANCE BENTO TILE (Full width - lg:col-span-6)
 */
export const SmartGuidanceTile = ({ analysis, className = 'lg:col-span-6' }) => {
  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stripe-card p-6 h-full flex flex-col justify-between border-l-4 border-l-[#533afd]"
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-light text-[#0d253d] dark:text-white tracking-tight">Smart Guidance</h3>
              <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">Personalized budget insights</p>
            </div>
            <span className={`inline-block text-[11px] font-normal px-2.5 py-1 rounded-full border ${analysis.health.className}`}>
              {analysis.health.label}
            </span>
          </div>

          {/* Today's Cap Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-[#64748d] dark:text-gray-400 mb-1.5 font-tnum">
              <span>Today's Spending</span>
              <span>{formatCurrency(analysis.todaysExpenses)} / {analysis.dailyCap > 0 ? formatCurrency(analysis.dailyCap) : '—'}</span>
            </div>
            <div className="w-full h-2 bg-[#e3e8ee] dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  analysis.todaysExpenses > analysis.dailyCap && analysis.dailyCap > 0 ? 'bg-[#ea2261]' : 'bg-[#533afd]'
                }`}
                style={{ width: `${analysis.todayPct}%` }}
              />
            </div>
          </div>

          {/* Tips List */}
          <div className="space-y-2">
            {analysis.advice.length > 0 ? (
              analysis.advice.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#f6f9fc] dark:bg-gray-800/40 border border-[#e3e8ee] dark:border-gray-700/60">
                  <span className="mt-1 w-2 h-2 rounded-full bg-[#533afd] shrink-0" />
                  <p className="text-xs text-[#0d253d] dark:text-gray-200 leading-snug font-normal">{tip}</p>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#f6f9fc] dark:bg-gray-800/40 border border-[#e3e8ee] dark:border-gray-700/60">
                <FaInfoCircle className="mt-0.5 text-[#533afd] text-xs shrink-0" />
                <p className="text-xs text-[#0d253d] dark:text-gray-200 leading-snug font-normal">Spending is balanced. Keep up the good habits!</p>
              </div>
            )}
          </div>
        </div>

        {analysis.requestSuggestion && (
          <div className="mt-4 p-3.5 bg-[#533afd]/5 dark:bg-[#533afd]/15 rounded-lg border border-[#533afd]/20">
            <div className="flex items-center gap-1.5 text-xs text-[#533afd] dark:text-[#665efd] font-normal mb-1">
              <FaLightbulb size={12} />
              <span>Smart Recommendation</span>
            </div>
            <p className="text-xs text-[#0d253d] dark:text-gray-200 leading-relaxed font-normal">{analysis.requestSuggestion}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

/**
 * DEFAULT FEEDBACK CARD (Insights View wrapper)
 */
const FeedbackCard = ({ transactions = [], balance = 0 }) => {
  const analysis = useInsightsAnalysis(transactions, balance);

  if (transactions.length === 0) {
    return (
      <div className="stripe-card p-8 text-center flex flex-col items-center justify-center space-y-3 lg:col-span-6">
        <div className="w-12 h-12 rounded-full bg-[#f6f9fc] dark:bg-gray-800 text-[#533afd] border border-[#e3e8ee] dark:border-gray-700 flex items-center justify-center shadow-sm">
          <FaChartPie className="text-xl opacity-80" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-light text-[#0d253d] dark:text-white tracking-tight">No Financial Insights Yet</h3>
          <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal leading-relaxed">
            Add your first income or expense transaction to generate spending charts, daily budget caps, and AI guidance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SpendingBreakdownTile analysis={analysis} className="lg:col-span-3" />
      <DailyCapTile dailyCap={analysis.dailyCap} className="lg:col-span-3" />
      <LastSavedTile lastSavingsTx={analysis.lastSavingsTx} className="lg:col-span-3" />
      <SmartGuidanceTile analysis={analysis} className="lg:col-span-6" />
    </>
  );
};

export default FeedbackCard;
