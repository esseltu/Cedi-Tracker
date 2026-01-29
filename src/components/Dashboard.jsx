import React from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaWallet } from 'react-icons/fa';
import CreditScoreGauge from './CreditScoreGauge';

const Dashboard = ({ balance, creditScore, onAddClick }) => {
  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-5 bg-gradient-to-br from-emerald-500/90 to-teal-600/90 text-white border-none shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-xs font-medium mb-1">Total Balance</p>
              <h1 className="text-3xl font-bold tracking-tight">₵ {balance.toFixed(2)}</h1>
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <FaWallet className="text-lg text-white" />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-emerald-100/80 font-light">
            Keep it up! Safe to spend today.
          </p>
        </div>
      </motion.div>

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
