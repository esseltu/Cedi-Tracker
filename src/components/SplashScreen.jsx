import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // 2.5 seconds splash

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white select-none overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1c1e54 0%, #0d253d 55%, #4434d4 100%)'
      }}
    >
      {/* Stripe Atmospheric Mesh Accents */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#ea2261]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#533afd]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Faint Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 8px)'
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center z-10"
      >
        {/* Currency Icon (₵) - Stripe Accent Container */}
        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(0,55,112,0.3)] border border-white/20 mb-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#533afd]/30 to-[#ea2261]/30 opacity-60" />
          <span className="text-4xl font-light text-white font-tnum relative z-10 drop-shadow-sm">₵</span>
        </div>

        {/* Title per DESIGN.md heading scale */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl md:text-3xl font-light tracking-tight text-white"
        >
          Cedi Tracker
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-1.5 text-xs font-normal text-gray-300 tracking-wide"
        >
          Track. Save. Grow.
        </motion.p>

        {/* Loading Spinner per Stripe Accent Token */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center gap-1.5"
        >
          <div className="w-2 h-2 rounded-full bg-[#533afd] animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-[#ea2261] animate-pulse [animation-delay:200ms]" />
          <div className="w-2 h-2 rounded-full bg-[#ffffff] animate-pulse [animation-delay:400ms]" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
