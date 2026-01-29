import React from 'react';
import { motion } from 'framer-motion';

const CreditScoreGauge = ({ score }) => {
  // Simple normalization: 300-850 range
  const minScore = 300;
  const maxScore = 850;
  const percentage = Math.min(100, Math.max(0, ((score - minScore) / (maxScore - minScore)) * 100));

  let color = "text-red-500";
  let label = "Needs Work";
  
  if (score >= 750) {
    color = "text-emerald-500";
    label = "Excellent";
  } else if (score >= 650) {
    color = "text-blue-500";
    label = "Good";
  } else if (score >= 550) {
    color = "text-yellow-500";
    label = "Fair";
  }

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Background Arc */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-gray-200 box-border"></div>
        
        {/* Progress Arc - rotated based on score */}
        <motion.div 
          initial={{ rotate: -45 }} // Start from empty position relative to clip
          animate={{ rotate: -45 + (1.8 * percentage) }} // 180 degrees total span
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-current box-border ${color}`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
        ></motion.div>
      </div>
      
      <div className="mt-[-10px] text-center">
        <h3 className={`text-2xl font-bold ${color}`}>{score}</h3>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
};

export default CreditScoreGauge;
