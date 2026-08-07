import React from 'react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';

const Login = ({ onLogin }) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1c1e54 0%, #0d253d 50%, #4434d4 100%)'
      }}
    >
      {/* Stripe Atmospheric Mesh Accents */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#ea2261]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#533afd]/30 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,55,112,0.25)] text-center relative z-10"
      >
        <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-md">
          <span className="text-2xl text-white font-light font-tnum">₵</span>
        </div>
        
        <h1 className="text-2xl font-light text-white mb-1 tracking-tight">Cedi Tracker</h1>
        <p className="text-gray-300 mb-6 text-xs font-normal">Your money. Your growth.</p>

        <button
          type="button"
          onClick={onLogin}
          className="btn-stripe-secondary w-full py-3 text-xs font-normal justify-center cursor-pointer shadow-md"
        >
          <FcGoogle className="text-base" />
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-[11px] text-gray-400 font-normal">
          Secure authentication powered by Firebase
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
