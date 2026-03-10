import React from 'react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';

const Login = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl text-center"
      >
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
          <span className="text-3xl">₵</span>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Cedi Tracker</h1>
        <p className="text-emerald-100 mb-6 text-sm font-medium">Your money. Your growth.</p>

        <button
          onClick={onLogin}
          className="w-full bg-white text-gray-800 font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-gray-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm"
        >
          <FcGoogle className="text-lg" />
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-xs text-emerald-200/60">
          Secure authentication powered by Firebase
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
