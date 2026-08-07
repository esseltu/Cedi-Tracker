import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import Dashboard, { DashboardSidebarWidgets } from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import TransactionList from './components/TransactionList';
import FeedbackCard from './components/FeedbackCard';
import Login from './components/Login';
import IncomeSuggestionModal from './components/IncomeSuggestionModal';
import ClearTransactionsModal from './components/ClearTransactionsModal';
import { exportTransactionsToPdf } from './utils/exportPdf';
import { FaHistory, FaChartPie, FaSignOutAlt, FaMoon, FaSun, FaFilePdf, FaTrashAlt } from 'react-icons/fa';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, history, analysis
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [lastIncome, setLastIncome] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTx, setUndoTx] = useState(null);
  const undoTimerRef = useRef(null);

  const getInitialTheme = () => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  };
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  // State
  const [transactions, setTransactions] = useState([]);

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  // Derived State (Memoized)
  const balance = React.useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  const creditScore = React.useMemo(() => {
    let score = 500;
    transactions.forEach(t => {
      let change = 0;
      if (t.type === 'income') {
        change = 20; 
      } else {
        if (t.category === 'Savings/Invest') {
          change = 40;
        } else if (t.amount > 200) {
          change = -20;
        } else if (t.category === 'Entertainment' && t.amount > 100) {
          change = -10;
        } else {
          change = 5;
        }
      }
      score += change;
    });
    return Math.max(300, Math.min(850, score));
  }, [transactions]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load Transactions from Firestore
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'), 
      where('uid', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTransactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      fetchedTransactions.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(b.date) - new Date(a.date);
        }
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
      });

      setTransactions(fetchedTransactions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTransactions([]);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAddTransaction = async (transaction) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      
      if (transaction.type === 'income') {
        setLastIncome(transaction);
      }
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to save transaction. Check internet connection.");
    }
  };

  const handleDeleteTransaction = async (id) => {
    const originalTransactions = [...transactions];
    const tx = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      await deleteDoc(doc(db, 'transactions', id));
      setUndoTx(tx || null);
      setShowUndo(true);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setShowUndo(false);
        setUndoTx(null);
        undoTimerRef.current = null;
      }, 6000);
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert(`Failed to delete: ${e.message}`);
      setTransactions(originalTransactions);
    }
  };

  const handleUndo = async () => {
    if (!undoTx || !user) {
      setShowUndo(false);
      return;
    }
    try {
      const { id: _id, uid: _uid, ...data } = undoTx;
      await addDoc(collection(db, 'transactions'), {
        ...data,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setShowUndo(false);
      setUndoTx(null);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    } catch (e) {
      console.error("Undo failed: ", e);
      alert("Failed to undo deletion.");
    }
  };

  const handleExportPdf = () => {
    exportTransactionsToPdf(transactions, user, balance);
  };

  const handleClearAllTransactions = async () => {
    if (!user || transactions.length === 0) return;
    setIsDeletingAll(true);
    try {
      const chunkSize = 400;
      for (let i = 0; i < transactions.length; i += chunkSize) {
        const chunk = transactions.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(t => {
          batch.delete(doc(db, 'transactions', t.id));
        });
        await batch.commit();
      }
      setShowClearModal(false);
      setTransactions([]);
    } catch (e) {
      console.error("Error clearing all transactions: ", e);
      alert(`Failed to clear transactions: ${e.message}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (loading) {
    return <SplashScreen onComplete={() => {}} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-24 max-w-md lg:max-w-[1200px] mx-auto relative px-4 sm:px-6 lg:px-8 lg:py-6">
      {/* 1. Top Bar - Spans full 1200px container width with matching gutters */}
      <header className="pt-6 lg:pt-0 pb-4 flex justify-between items-center sticky top-0 z-30 bg-[#f6f9fc]/90 dark:bg-[#0b1329]/90 backdrop-blur-md mb-2 lg:mb-8 border-b border-[#e3e8ee] dark:border-gray-800">
        <div>
          <h1 className="text-xl lg:text-2xl font-light text-[#0d253d] dark:text-white tracking-tight">
            Cedi Tracker
          </h1>
          <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">
            Welcome, {user.displayName?.split(' ')[0] || 'Essel'}
          </p>
        </div>

        {/* Desktop Header Navigation Tabs (Stripe Segmented Controls) */}
        <div className="hidden lg:flex items-center gap-1 bg-[#e3e8ee]/60 dark:bg-gray-800/80 p-1 rounded-full border border-[#e3e8ee] dark:border-gray-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-[#533afd] text-[#0d253d] dark:text-white shadow-sm'
                : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-[#533afd] text-[#0d253d] dark:text-white shadow-sm'
                : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
              activeTab === 'analysis'
                ? 'bg-white dark:bg-[#533afd] text-[#0d253d] dark:text-white shadow-sm'
                : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
            }`}
          >
            Insights
          </button>
        </div>

        {/* User Profile & Stripe-style Icon Buttons */}
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={toggleTheme} className="btn-stripe-icon" aria-label="Toggle theme" title="Toggle Theme">
            {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>
          
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-[#e3e8ee] dark:border-gray-700 shadow-sm" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 flex items-center justify-center font-normal text-xs font-tnum">
              {user.email?.[0].toUpperCase() || 'U'}
            </div>
          )}

          <button onClick={handleLogout} className="btn-stripe-icon text-[#64748d] hover:text-[#ea2261]" title="Sign Out">
            <FaSignOutAlt size={14} />
          </button>
        </div>
      </header>

      {/* Main Responsive CSS Grid Layout (Left 8-cols ~67% / Right 4-cols ~33% sticky sidebar) */}
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* Left Column (~67% width): Cedi Card, Low Funds banner, Recent Transactions */}
          <div className="lg:col-span-8 space-y-6 w-full">
            <Dashboard 
              balance={balance} 
              creditScore={creditScore} 
              transactions={transactions}
              cardHolder={user?.displayName || 'YOU'}
              onAddClick={() => setShowAddModal(true)} 
            />

            {/* Mobile-only Sidebar Widgets */}
            <div className="lg:hidden space-y-4">
              <DashboardSidebarWidgets 
                creditScore={creditScore} 
                onAddClick={() => setShowAddModal(true)} 
              />
            </div>

            {/* Recent Transactions Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-[#0d253d] dark:text-white tracking-tight">
                  {activeTab === 'dashboard' ? 'Recent Transactions' : activeTab === 'analysis' ? 'Financial Insights' : 'Transaction History'}
                </h2>
                
                {/* Stripe-style Icon Buttons for View Toggle (Mobile) */}
                <div className="flex lg:hidden items-center gap-1.5">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`btn-stripe-icon ${activeTab === 'dashboard' ? '!bg-[#533afd] !text-white !border-[#533afd]' : ''}`}
                    title="Transaction View"
                  >
                    <FaHistory size={13} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('analysis')}
                    className={`btn-stripe-icon ${activeTab === 'analysis' ? '!bg-[#533afd] !text-white !border-[#533afd]' : ''}`}
                    title="Insights View"
                  >
                    <FaChartPie size={13} />
                  </button>
                </div>
              </div>

              {/* Stripe Segmented Filter Pills & Buttons */}
              {(activeTab === 'dashboard' || activeTab === 'history') && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-1.5 p-1 bg-[#e3e8ee]/50 dark:bg-gray-800/60 rounded-full border border-[#e3e8ee] dark:border-gray-700">
                    {['all', 'expense', 'income'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3.5 py-1 text-xs font-normal rounded-full capitalize transition-all cursor-pointer ${
                          filterType === type 
                            ? 'bg-[#533afd] text-white shadow-sm' 
                            : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Stripe Secondary PDF & Destructive Clear Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={transactions.length === 0}
                      className="btn-stripe-secondary text-xs !py-1.5 !px-3"
                      title="Export Transactions as PDF"
                    >
                      <FaFilePdf size={12} />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClearModal(true)}
                      disabled={transactions.length === 0}
                      className="btn-stripe-danger text-xs !py-1.5 !px-3"
                      title="Clear All Transactions"
                    >
                      <FaTrashAlt size={11} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <>
                  <TransactionList transactions={filteredTransactions.slice(0, 7)} onDelete={handleDeleteTransaction} />
                  {filteredTransactions.length > 7 && (
                    <button 
                      onClick={() => setActiveTab('history')} 
                      className="w-full py-2.5 text-xs font-normal text-center text-[#533afd] dark:text-[#665efd] hover:underline cursor-pointer"
                    >
                      View All History ({filteredTransactions.length} items) →
                    </button>
                  )}
                </>
              )}

              {activeTab === 'history' && (
                <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} />
              )}

              {activeTab === 'analysis' && (
                <FeedbackCard transactions={transactions} balance={balance} />
              )}
            </div>
          </div>

          {/* Right Column Sidebar on Desktop (~33% width sticky sidebar) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24 w-full">
            <h3 className="text-xs font-normal text-[#64748d] uppercase tracking-widest">
              Account Overview
            </h3>

            {/* Desktop Credit Score & Add Transaction Widgets */}
            <DashboardSidebarWidgets 
              creditScore={creditScore} 
              onAddClick={() => setShowAddModal(true)} 
            />

            {/* Desktop Financial Summary Widget - Stripe card-feature-light */}
            <div className="stripe-card p-5 space-y-3">
              <h4 className="text-xs font-normal text-[#64748d] uppercase tracking-wider">
                Financial Summary
              </h4>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-[#533afd]/5 dark:bg-[#533afd]/15 border border-[#533afd]/20">
                  <p className="text-[10px] text-[#533afd] dark:text-[#665efd] font-normal uppercase tracking-wider">Total Income</p>
                  <p className="text-base font-normal font-tnum text-[#533afd] dark:text-[#665efd] mt-0.5">
                    GH₵ {transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#ea2261]/5 dark:bg-[#ea2261]/15 border border-[#ea2261]/20">
                  <p className="text-[10px] text-[#ea2261] dark:text-[#f96bee] font-normal uppercase tracking-wider">Total Expenses</p>
                  <p className="text-base font-normal font-tnum text-[#ea2261] dark:text-[#f96bee] mt-0.5">
                    GH₵ {transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Add Transaction Modal */}
      <AddTransaction 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleAddTransaction} 
      />

      {/* Income Suggestion Modal */}
      <IncomeSuggestionModal 
        income={lastIncome} 
        onClose={() => setLastIncome(null)} 
      />

      {/* Clear All Transactions Confirmation Modal */}
      <ClearTransactionsModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAllTransactions}
        count={transactions.length}
        isDeleting={isDeletingAll}
      />

      {/* Undo Snackbar */}
      {showUndo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-3 bg-[#0d253d] text-white rounded-xl shadow-xl flex items-center gap-3 border border-white/10">
            <span className="text-xs font-normal">Transaction deleted</span>
            <button
              onClick={handleUndo}
              className="btn-stripe-secondary !py-1 !px-3 text-xs"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
