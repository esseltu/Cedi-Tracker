import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/currency';

const COLORS = {
  'Food': '#F97316', // Orange
  'Transport': '#3B82F6', // Blue
  'Data/Airtime': '#0EA5E9', // Sky
  'Entertainment': '#A855F7', // Purple
  'Savings/Invest': '#10B981', // Emerald
  'Other': '#9CA3AF', // Gray
};

const FeedbackCard = ({ transactions, balance }) => {
  const analysis = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Category breakdown
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const chartData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    })).filter(item => item.value > 0);

    // Generate Advice
    const advice = [];
    const foodSpent = categoryTotals['Food'] || 0;
    const transportSpent = categoryTotals['Transport'] || 0;
    const entertainmentSpent = categoryTotals['Entertainment'] || 0;

    if (totalSpent > 0) {
      if (foodSpent / totalSpent > 0.4) {
        advice.push("Spending high on Food. Try cooking or cheaper spots?");
      }
      if (transportSpent / totalSpent > 0.3) {
        advice.push("Transport costs are adding up. Can you walk short distances?");
      }
      if (entertainmentSpent / totalSpent > 0.15) {
        advice.push("Cut back on Entertainment to boost savings.");
      }
    }

    if (balance < 100) {
      advice.push(`Balance is low! Keep ${formatCurrency(200)} for emergencies.`);
    } else if (balance > 500) {
      advice.push(`Great balance! Consider investing ${formatCurrency(50)}.`);
    }

    // Request Suggestion
    let requestSuggestion = null;
    if (balance < 150) {
      requestSuggestion = `Request ${formatCurrency(400)} from parents next week.`;
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
      .reduce((sum, t) => sum + t.amount, 0);
    const todayPct = dailyCap > 0 ? Math.min(100, Math.round((todaysExpenses / dailyCap) * 100)) : 0;

    const health =
      balance < 0 ? { label: 'Stop', className: 'bg-red-100 text-red-700 border-red-200' } :
      balance < 100 ? { label: 'Caution', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' } :
      { label: 'On track', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

    return { totalSpent, chartData, advice, requestSuggestion, topCategoryName, topCategoryValue, topCategoryPct, dailyCap, todaysExpenses, todayPct, health };
  }, [transactions, balance]);

  if (analysis.totalSpent === 0 && !analysis.requestSuggestion) return null;

  return (
    <div className="space-y-6">
      {/* Spending Breakdown */}
      {analysis.totalSpent > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Spending Analysis</h3>
          
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analysis.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analysis.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Other']} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-xs text-gray-400">Total</span>
                <p className="font-bold text-gray-700">{formatCurrency(analysis.totalSpent)}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {analysis.chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[item.name] }}></div>
                <span className="text-gray-600 truncate">{item.name}</span>
                <span className="font-medium text-gray-800">{formatCurrency(Number(item.value))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback / Advice */}
      <div className="glass-card p-6 border-l-4 border-emerald-500">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Smart Insights</h3>
            <p className="text-xs text-gray-500">Quick guidance based on your activity</p>
          </div>
          <div className="text-right">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${analysis.health.className}`}>
              {analysis.health.label}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <div className="p-3 rounded-xl bg-white/50 border border-white/60">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Daily Cap</p>
            <p className="text-sm font-bold text-gray-800">{analysis.dailyCap > 0 ? formatCurrency(analysis.dailyCap) : '—'}</p>
          </div>
        </div>
        

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Today</span>
            <span>{formatCurrency(analysis.todaysExpenses)} / {analysis.dailyCap > 0 ? formatCurrency(analysis.dailyCap) : '—'}</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${analysis.todaysExpenses > analysis.dailyCap && analysis.dailyCap > 0 ? 'bg-red-400' : 'bg-emerald-500'}`}
              style={{ width: `${analysis.todayPct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {analysis.advice.length > 0 ? (
            analysis.advice.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/40 border border-white/60">
                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <p className="text-sm text-gray-700 leading-snug">{tip}</p>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-xl bg-white/40 border border-white/60">
              <p className="text-sm text-gray-600">Good job! Spending looks balanced.</p>
            </div>
          )}
        </div>

        {analysis.requestSuggestion && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100"
          >
            <p className="text-sm text-blue-800 font-medium">💡 Suggestion</p>
            <p className="text-sm text-blue-600 mt-1">{analysis.requestSuggestion}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FeedbackCard;
