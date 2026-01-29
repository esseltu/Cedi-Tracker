import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
      advice.push("Balance is low! Keep 200 ₵ for emergencies.");
    } else if (balance > 500) {
      advice.push("Great balance! Consider investing 50 ₵.");
    }

    // Request Suggestion
    let requestSuggestion = null;
    if (balance < 150) {
      requestSuggestion = "Request 400 ₵ from parents next week.";
    }

    return { totalSpent, chartData, advice, requestSuggestion };
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
                  formatter={(value) => `₵${value}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-xs text-gray-400">Total</span>
                <p className="font-bold text-gray-700">₵{analysis.totalSpent.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {analysis.chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[item.name] }}></div>
                <span className="text-gray-600 truncate">{item.name}</span>
                <span className="font-medium text-gray-800">₵{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback / Advice */}
      <div className="glass-card p-6 border-l-4 border-emerald-500">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Smart Insights</h3>
        <div className="space-y-2">
          {analysis.advice.length > 0 ? (
            analysis.advice.map((tip, idx) => (
              <p key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-emerald-500 mt-1">●</span> {tip}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-500">Good job! Spending looks balanced.</p>
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
