import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FaChartPie, FaLightbulb, FaInfoCircle, FaWallet, FaPiggyBank, FaCoins, FaSlidersH, FaCheck } from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

const COLORS = {
  'Food': '#f97316',
  'Transport': '#533afd',
  'Data/Airtime': '#0ea5e9',
  'Entertainment': '#f96bee',
  'Savings/Invest': '#059669',
  'Other': '#64748d',
};

const defaultCaps = {
  'Food': 20,
  'Transport': 15,
  'Data/Airtime': 10,
  'Entertainment': 10,
  'Savings/Invest': 20,
  'Other': 10,
};

export const useInsightsAnalysis = (transactions = [], balance = 0) => {
  const [budgets, setBudgets] = useState(() => {
    try {
      const stored = localStorage.getItem('dailyCategoryBudgets');
      return stored ? JSON.parse(stored) : defaultCaps;
    } catch {
      return defaultCaps;
    }
  });

  const [highlightedCategory, setHighlightedCategory] = useState(null);

  const updateBudgets = (newBudgets) => {
    setBudgets(newBudgets);
    localStorage.setItem('dailyCategoryBudgets', JSON.stringify(newBudgets));
  };

  return useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');

    const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const currentMonthExpenses = expenses.filter(t => t.date && t.date.startsWith(currentMonthStr));
    const currentMonthIncomes = incomes.filter(t => t.date && t.date.startsWith(currentMonthStr));

    const totalSpent = currentMonthExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalIncome = currentMonthIncomes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const categoryTotals = currentMonthExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

    const chartData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    const allTimeTotalSpent = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const allTimeCategoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

    const allTimeChartData = Object.entries(allTimeCategoryTotals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    const advice = [];
    const foodSpent = categoryTotals['Food'] || 0;
    const transportSpent = categoryTotals['Transport'] || 0;
    const entertainmentSpent = categoryTotals['Entertainment'] || 0;

    if (totalSpent > 0) {
      if (foodSpent / totalSpent > 0.4) {
        advice.push({ cat: 'Food', msg: "Spending high on Food (>40%). Consider meal planning or budget dining." });
      }
      if (transportSpent / totalSpent > 0.3) {
        advice.push({ cat: 'Transport', msg: "Transport takes >30% of expenses. Combine trips where possible." });
      }
      if (entertainmentSpent / totalSpent > 0.15) {
        advice.push({ cat: 'Entertainment', msg: "Entertainment is above 15%. Trim leisure spending to boost savings." });
      }
    } else if (totalIncome > 0) {
      advice.push({ cat: 'all', msg: `Great start! You've logged ${formatCurrency(totalIncome)} in income. Allocate 20% to savings.` });
    }

    if (balance < 100 && balance > 0) {
      advice.push({ cat: 'all', msg: `Balance is low! Reserve at least ${formatCurrency(200)} for emergencies.` });
    }

    let requestSuggestion = null;
    if (balance < 150 && balance > 0) {
      requestSuggestion = `Consider topping up your balance with ${formatCurrency(400)} for upcoming expenses.`;
    }

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || null;
    const topCategoryName = topCategory ? topCategory[0] : null;
    const topCategoryValue = topCategory ? topCategory[1] : 0;
    const topCategoryPct = totalSpent > 0 ? Math.round((topCategoryValue / totalSpent) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysExpensesList = expenses.filter(t => t.date === todayStr);
    
    const todaysExpenses = todaysExpensesList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const dailyCategoryTotals = todaysExpensesList.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});
    
    let dailyCap = 0;
    let todaysCappedExpenses = 0;
    let todaysUncappedExpenses = 0;

    Object.keys(defaultCaps).forEach(cat => {
      const cap = budgets[cat];
      const spent = dailyCategoryTotals[cat] || 0;
      if (cap !== '' && cap !== undefined && cap !== null && cap > 0) {
        dailyCap += cap;
        todaysCappedExpenses += spent;
      } else {
        todaysUncappedExpenses += spent;
      }
    });

    const todayPct = dailyCap > 0 ? Math.min(100, Math.round((todaysCappedExpenses / dailyCap) * 100)) : 0;

    let hasCategoryWarnings = false;
    Object.keys(defaultCaps).forEach(cat => {
      const cap = budgets[cat];
      const spent = dailyCategoryTotals[cat] || 0;
      if (cap !== '' && cap !== undefined && cap !== null && cap > 0) {
        const pct = (spent / cap) * 100;
        if (pct > 100) {
          advice.unshift({ cat, msg: `${cat} spending is over its daily cap.` });
          hasCategoryWarnings = true;
        } else if (pct >= 75) {
          advice.unshift({ cat, msg: `You're at ${Math.round(pct)}% of your ${cat} budget today.` });
          hasCategoryWarnings = true;
        }
      }
    });

    if (!hasCategoryWarnings && todaysCappedExpenses > 0) {
      advice.push({ cat: 'all', msg: "Spending is balanced. Keep up the good habits!" });
    } else if (!hasCategoryWarnings && todaysUncappedExpenses === 0 && todaysCappedExpenses === 0 && advice.length === 0) {
      advice.push({ cat: 'all', msg: "No spending logged today. Keep up the good habits!" });
    }

    const savingsTxs = transactions.filter(t => t.type === 'expense' && t.category === 'Savings/Invest');
    const lastSavingsTx = savingsTxs
      .slice()
      .sort((a, b) => {
        if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
        if (a.createdAt && b.createdAt) return b.createdAt.toMillis() - a.createdAt.toMillis();
        return 0;
      })[0];

    const health =
      balance < 0
        ? { label: 'Debt Alert', className: 'bg-[#ea2261]/10 text-[#ea2261] border-[#ea2261]/30 dark:bg-[#ea2261]/20 dark:text-[#f96bee]' }
        : dailyCap > 0 && todaysCappedExpenses > dailyCap
        ? { label: 'Over Daily Cap', className: 'bg-[#ea2261]/10 text-[#ea2261] border-[#ea2261]/30 dark:bg-[#ea2261]/20 dark:text-[#f96bee]' }
        : balance < 100
        ? { label: 'Caution', className: 'bg-[#9b6829]/10 text-[#9b6829] border-[#9b6829]/30 dark:bg-[#9b6829]/20 dark:text-[#fde68a]' }
        : { label: 'On Track', className: 'bg-[#533afd]/10 text-[#533afd] border-[#533afd]/30 dark:bg-[#533afd]/20 dark:text-[#665efd]' };

    return { 
      budgets, updateBudgets, highlightedCategory, setHighlightedCategory,
      totalSpent, totalIncome, categoryTotals, dailyCategoryTotals, chartData, advice, 
      requestSuggestion, topCategoryName, topCategoryValue, topCategoryPct, 
      dailyCap, todaysExpenses, todaysCappedExpenses, todaysUncappedExpenses, todayPct, 
      lastSavingsTx, health,
      allTimeTotalSpent, allTimeChartData
    };
  }, [transactions, balance, budgets, highlightedCategory]);
};

/**
 * SPENDING BREAKDOWN BENTO TILE (lg:col-span-3)
 */
export const SpendingBreakdownTile = ({ analysis, className = 'lg:col-span-3' }) => {
  const [scope, setScope] = useState('thisMonth'); // 'thisMonth' | 'allTime'
  
  const currentTotalSpent = scope === 'thisMonth' ? analysis.totalSpent : analysis.allTimeTotalSpent;
  const currentChartData = scope === 'thisMonth' ? analysis.chartData : analysis.allTimeChartData;

  if (analysis.allTimeTotalSpent > 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="stripe-card p-6 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-light text-[#0d253d] dark:text-white tracking-tight">Spending Breakdown</h3>
            <div className="flex p-0.5 bg-[#f6f9fc] dark:bg-gray-800/80 rounded-full border border-[#e3e8ee] dark:border-gray-700 w-[140px]">
              <button
                type="button"
                onClick={() => setScope('thisMonth')}
                className={`flex-1 py-1 text-[10px] font-normal rounded-full transition-all cursor-pointer ${
                  scope === 'thisMonth' 
                    ? 'bg-[#533afd] text-white shadow-sm font-medium' 
                    : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d] dark:hover:text-white'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setScope('allTime')}
                className={`flex-1 py-1 text-[10px] font-normal rounded-full transition-all cursor-pointer ${
                  scope === 'allTime' 
                    ? 'bg-[#533afd] text-white shadow-sm font-medium' 
                    : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d] dark:hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {currentTotalSpent > 0 ? (
            <>
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {currentChartData.map((entry, index) => (
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
                    <span className="text-[10px] uppercase tracking-wider text-[#64748d] dark:text-gray-400 font-normal block leading-tight">
                      Total Spent<br/>{scope === 'thisMonth' ? 'This Month' : 'All Time'}
                    </span>
                    <p className="text-lg font-light text-[#0d253d] dark:text-white font-tnum mt-0.5">
                      {formatCurrency(currentTotalSpent)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Legend Grid */}
              <div className="mt-3 pt-3 border-t border-[#e3e8ee] dark:border-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {currentChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[item.name] || COLORS['Other'] }} />
                    <div className="min-w-0 flex-1">
                      <span className="text-[#64748d] dark:text-gray-400 font-normal block text-[11px] truncate">{item.name}</span>
                      <span className="font-normal font-tnum text-[#0d253d] dark:text-white block truncate">{formatCurrency(Number(item.value))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#f6f9fc] dark:bg-gray-800 text-[#64748d] flex items-center justify-center mb-3">
                <FaChartPie size={16} />
              </div>
              <p className="text-xs text-[#64748d] dark:text-gray-400">No expenses logged {scope === 'thisMonth' ? 'this month' : 'yet'}.</p>
            </div>
          )}
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
 * CATEGORY BUDGET CAPS BENTO TILE (lg:col-span-6)
 */
export const CategoryBudgetsTile = ({ analysis, className = 'lg:col-span-6' }) => {
  const { budgets, updateBudgets, dailyCategoryTotals, setHighlightedCategory, highlightedCategory } = analysis;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(budgets);

  const handleSaveCaps = () => {
    updateBudgets(editForm);
    setIsEditing(false);
  };

  const handleCategoryClick = (cat) => {
    setHighlightedCategory(cat);
    const guidanceSection = document.getElementById('smart-guidance-section');
    if (guidanceSection) {
      guidanceSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stripe-card p-6 h-full flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-light text-[#0d253d] dark:text-white tracking-tight">Per-Category Daily Budget Caps</h3>
              <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">Monitor spending limits per category</p>
            </div>
            <button 
              type="button"
              onClick={() => { setEditForm(budgets); setIsEditing(!isEditing); }}
              className="btn-stripe-secondary text-xs !py-1 !px-3"
            >
              <FaSlidersH size={11} />
              <span>{isEditing ? 'Cancel' : 'Set Category Caps'}</span>
            </button>
          </div>

          {/* Edit Form Drawer */}
          {isEditing ? (
            <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-gray-800/60 border border-[#e3e8ee] dark:border-gray-700 space-y-3 mb-4">
              <h4 className="text-xs font-normal text-[#0d253d] dark:text-white uppercase tracking-wider">Set Daily Caps (GH₵)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(defaultCaps).map((cat) => (
                  <div key={cat}>
                    <label className="block text-[11px] text-[#64748d] dark:text-gray-400 mb-1 truncate">{cat}</label>
                    <input 
                      type="number"
                      min="0"
                      value={editForm[cat] ?? 0}
                      onChange={(e) => setEditForm({ ...editForm, [cat]: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full text-xs font-normal font-tnum bg-white dark:bg-[#0b1329] border border-[#a8c3de] dark:border-gray-700 rounded py-1.5 px-2 text-[#0d253d] dark:text-white outline-none focus:border-[#533afd]"
                    />
                  </div>
                ))}
              </div>
              <button 
                type="button"
                onClick={handleSaveCaps}
                className="btn-stripe-primary text-xs !py-1.5 !px-4 mt-2"
              >
                <FaCheck size={11} />
                <span>Save Category Caps</span>
              </button>
            </div>
          ) : null}

          {/* Progress Bars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(defaultCaps).map((cat) => {
              const spent = dailyCategoryTotals[cat] || 0;
              const cap = budgets[cat];
              const hasCap = cap !== '' && cap !== undefined && cap !== null && cap > 0;
              
              const pct = hasCap ? Math.min(100, Math.round((spent / cap) * 100)) : 0;
              const isOver = hasCap && spent > cap;
              const isWarning = hasCap && pct >= 75 && !isOver;

              const progressColor = isOver 
                ? 'bg-[#ea2261]' 
                : isWarning 
                ? 'bg-[#9b6829]' 
                : 'bg-[#533afd]';
                
              const isHighlighted = highlightedCategory === cat;

              return (
                <div 
                  key={cat} 
                  onClick={() => handleCategoryClick(cat)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 space-y-1.5 border ${
                    isHighlighted 
                      ? 'bg-[#533afd]/5 dark:bg-[#533afd]/15 border-[#533afd] shadow-sm' 
                      : 'bg-[#f6f9fc] dark:bg-gray-800/40 border-[#e3e8ee] dark:border-gray-700/60 hover:bg-[#e3e8ee]/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-normal text-[#0d253d] dark:text-gray-200 truncate">{cat}</span>
                    <span className="font-tnum text-[11px] text-[#64748d] dark:text-gray-400">
                      {formatCurrency(spent)} {hasCap && <span>/ <strong className="text-[#0d253d] dark:text-white">{formatCurrency(cap)}</strong></span>}
                    </span>
                  </div>
                  {hasCap ? (
                    <div className="w-full h-1.5 bg-[#e3e8ee] dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${progressColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  ) : (
                    <div className="w-full h-1.5 bg-transparent rounded-full flex items-center">
                      <span className="text-[10px] text-[#64748d]/60 font-medium tracking-wide">NO LIMIT</span>
                    </div>
                  )}
                  {hasCap && (
                    <div className="flex justify-between items-center text-[10px] text-[#64748d] dark:text-gray-400 mt-1">
                      <span className={isOver ? 'text-[#ea2261] font-normal' : isWarning ? 'text-[#9b6829] font-normal' : ''}>
                        {isOver ? 'Exceeded Cap!' : isWarning ? 'Near Limit' : 'Within Budget'}
                      </span>
                      <span className="font-tnum">{pct}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
    <div className={`w-full ${className}`} id="smart-guidance-section">
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
              <span>Today's Spending (Capped Categories)</span>
              <span>{formatCurrency(analysis.todaysCappedExpenses)} / {analysis.dailyCap > 0 ? formatCurrency(analysis.dailyCap) : '—'}</span>
            </div>
            <div className="w-full h-2 bg-[#e3e8ee] dark:bg-gray-700 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  analysis.todaysCappedExpenses > analysis.dailyCap && analysis.dailyCap > 0 ? 'bg-[#ea2261]' : 'bg-[#533afd]'
                }`}
                style={{ width: `${analysis.todayPct}%` }}
              />
            </div>
            {analysis.todaysUncappedExpenses > 0 && (
              <p className="text-[10px] text-[#64748d] font-normal font-tnum mt-1">
                Uncapped spending today: {formatCurrency(analysis.todaysUncappedExpenses)}
              </p>
            )}
          </div>

          {/* Tips List */}
          <div className="space-y-2">
            {analysis.advice.length > 0 ? (
              analysis.advice.map((tip, idx) => {
                const isHighlighted = analysis.highlightedCategory && tip.cat === analysis.highlightedCategory;
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2.5 p-3 rounded-lg border transition-colors duration-300 ${
                      isHighlighted
                        ? 'bg-[#533afd]/10 dark:bg-[#533afd]/20 border-[#533afd]/40'
                        : 'bg-[#f6f9fc] dark:bg-gray-800/40 border-[#e3e8ee] dark:border-gray-700/60'
                    }`}
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isHighlighted ? 'bg-[#533afd]' : 'bg-[#533afd]/60'}`} />
                    <p className={`text-xs leading-snug font-normal ${isHighlighted ? 'text-[#0d253d] dark:text-white font-medium' : 'text-[#0d253d] dark:text-gray-200'}`}>
                      {tip.msg}
                    </p>
                  </div>
                );
              })
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
      <CategoryBudgetsTile analysis={analysis} className="lg:col-span-6" />
      <SmartGuidanceTile analysis={analysis} className="lg:col-span-6" />
    </>
  );
};

export default FeedbackCard;
