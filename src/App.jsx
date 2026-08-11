import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import Dashboard, { 
  CediCardTile, 
  CreditScoreTile, 
  AddTransactionTile, 
  TotalIncomeTile, 
  TotalExpensesTile, 
  LowFundsBannerTile 
} from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import TransactionList from './components/TransactionList';
import FeedbackCard, { 
  useInsightsAnalysis, 
  SpendingBreakdownTile, 
  DailyCapTile, 
  LastSavedTile, 
  CategoryBudgetsTile,
  SmartGuidanceTile 
} from './components/FeedbackCard';
import Login from './components/Login';
import IncomeSuggestionModal from './components/IncomeSuggestionModal';
import ClearTransactionsModal from './components/ClearTransactionsModal';
import { exportTransactionsToPdf } from './utils/exportPdf';
import { FaHistory, FaChartPie, FaSignOutAlt, FaMoon, FaSun, FaFilePdf, FaTrashAlt, FaSearch, FaCheckCircle, FaHome } from 'react-icons/fa';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, updateDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, history, analysis
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [lastIncome, setLastIncome] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTx, setUndoTx] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const undoTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

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

  // Filter Logic (Search + Type Filter)
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      t.category.toLowerCase().includes(q) || 
      (t.note && t.note.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  // Derived State (Memoized)
  const balance = React.useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  const totalIncome = React.useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalExpenses = React.useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
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

  const insightsAnalysis = useInsightsAnalysis(transactions, balance);

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

  // Auto-process monthly recurring transactions on app load
  useEffect(() => {
    if (!user || transactions.length === 0) return;

    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7); // "YYYY-MM"
    const currentDayStr = String(today.getDate()).padStart(2, '0');
    const targetDateStr = `${currentMonthStr}-${currentDayStr}`;

    const recurringTemplates = transactions.filter(t => t.isRecurring);
    recurringTemplates.forEach(async (recTx) => {
      const alreadyLogged = transactions.some(t => 
        t.category === recTx.category && 
        t.amount === recTx.amount && 
        t.date && t.date.startsWith(currentMonthStr)
      );

      if (!alreadyLogged) {
        try {
          await addDoc(collection(db, 'transactions'), {
            amount: recTx.amount,
            category: recTx.category,
            note: recTx.note ? `${recTx.note} (Auto-recurring)` : 'Auto-recurring monthly',
            date: targetDateStr,
            type: recTx.type,
            isRecurring: true,
            uid: user.uid,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Auto-recurring log failed:", err);
        }
      }
    });
  }, [user, transactions]);

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

      // Show success toast
      setSuccessMsg(`${transaction.type === 'income' ? 'Income' : 'Expense'} of GH₵${transaction.amount.toLocaleString()} added!`);
      setShowSuccessToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowSuccessToast(false), 4000);

    } catch (e) {
      console.error("Error adding document: ", e);
      alert(`Failed to save transaction: ${e.message}`);
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

  const handleUpdateTransaction = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, 'transactions', id), updatedData);
    } catch (e) {
      console.error("Error updating transaction: ", e);
      alert(`Failed to update transaction: ${e.message}`);
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

  const persistentCreditScoreTile = (
    <CreditScoreTile 
      key="persistent-credit-score-tile"
      creditScore={creditScore}
      isLoading={loading}
      className={activeTab === 'history' ? 'md:col-span-2 lg:col-span-2' : 'md:col-span-2 lg:col-span-3'} 
    />
  );

  return (
    <div className="min-h-screen pb-24 max-w-md md:max-w-3xl lg:max-w-[1200px] mx-auto relative px-4 sm:px-6 lg:px-8 lg:py-6 overflow-x-hidden">
      {/* Top Bar */}
      <header className="py-3 sm:py-4 flex justify-between items-center sticky top-0 z-30 bg-[#f6f9fc]/95 dark:bg-[#0b1329]/95 backdrop-blur-md mb-4 lg:mb-6 border-b border-[#e3e8ee] dark:border-gray-800 shadow-[0_2px_10px_-4px_rgba(0,55,112,0.05)] dark:shadow-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#0d253d] dark:text-white tracking-tight mb-0.5 leading-none">
            Cedi Tracker
          </h1>
          <p className="text-[11px] sm:text-xs text-[#64748d] dark:text-gray-400 font-medium tracking-wide">
            Welcome, {user.displayName?.split(' ')[0] || 'Essel'}
          </p>
        </div>

        {/* Navigation Tabs (Stripe Segmented Controls) */}
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

        {/* User Profile & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} className="btn-stripe-icon" aria-label="Toggle theme" title="Toggle Theme">
            {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>
          
          <div className="flex items-center gap-1 p-1 bg-[#e3e8ee]/50 dark:bg-gray-800/60 rounded-full border border-[#e3e8ee] dark:border-gray-700">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white dark:ring-gray-700 shadow-sm object-cover" />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#533afd]/10 text-[#533afd] ring-2 ring-white dark:ring-[#1c1e54] flex items-center justify-center font-medium text-sm shadow-sm">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
            )}

            <button onClick={handleLogout} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[#64748d] hover:bg-white hover:text-[#ea2261] dark:hover:bg-[#1c1e54] dark:hover:text-rose-400 transition-all cursor-pointer" title="Sign Out">
              <FaSignOutAlt size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Bento Grid Mosaic Container */}
      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 items-stretch">
          
          {/* DASHBOARD TAB BENTO MOSAIC */}
          {activeTab === 'dashboard' && (
            <>
              {/* Row 1: Cedi Card Hero Tile (3 cols) | Credit Score (3 cols) */}
              <CediCardTile 
                balance={balance} 
                cardHolder={user?.displayName || 'YOU'} 
                isLoading={loading}
                className="md:col-span-2 lg:col-span-3" 
              />
              {persistentCreditScoreTile}

              {/* Row 2: Add Transaction (2 cols) | Total Income (2 cols) | Total Expenses (2 cols) */}
              <AddTransactionTile 
                onAddClick={() => setShowAddModal(true)} 
                className="md:col-span-2 lg:col-span-2" 
              />
              <TotalIncomeTile totalIncome={totalIncome} className="md:col-span-1 lg:col-span-2" />
              <TotalExpensesTile totalExpenses={totalExpenses} className="md:col-span-1 lg:col-span-2" />

              {/* Row 3: Low Funds Warning Banner Tile (Full 6 cols) */}
              <LowFundsBannerTile 
                balance={balance} 
                creditScore={creditScore} 
                transactions={transactions} 
                className="md:col-span-2 lg:col-span-6" 
              />

              {/* Row 4: Recent Transactions Table Tile (Full 6 cols) */}
              <div className="md:col-span-2 lg:col-span-6 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-light text-[#0d253d] dark:text-white tracking-tight">
                    Recent Transactions
                  </h2>


                </div>

                {/* Filter Pills, Search Bar & Actions */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
                    <div className="flex gap-1.5 p-1 bg-[#e3e8ee]/50 dark:bg-gray-800/60 rounded-full border border-[#e3e8ee] dark:border-gray-700 w-full md:w-auto">
                      {['all', 'expense', 'income'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-normal rounded-full capitalize transition-all cursor-pointer ${
                            filterType === type 
                              ? 'bg-[#533afd] text-white shadow-sm' 
                              : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative flex items-center w-full md:w-auto">
                      <FaSearch className="absolute left-3 text-xs text-[#64748d] dark:text-gray-400 pointer-events-none" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search note or category..."
                        className="w-full md:w-60 lg:w-52 pl-8 pr-3 py-1.5 text-xs font-normal bg-white dark:bg-gray-800/80 border border-[#e3e8ee] dark:border-gray-700 rounded-full text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={transactions.length === 0}
                      className="flex-1 sm:flex-none btn-stripe-secondary text-xs !py-1.5 !px-3 justify-center"
                      title="Export Transactions as PDF"
                    >
                      <FaFilePdf size={12} />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClearModal(true)}
                      disabled={transactions.length === 0}
                      className="flex-1 sm:flex-none btn-stripe-danger text-xs !py-1.5 !px-3 justify-center"
                      title="Clear All Transactions"
                    >
                      <FaTrashAlt size={11} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Table Content */}
                <TransactionList 
                  transactions={filteredTransactions.slice(0, 7)} 
                  onDelete={handleDeleteTransaction} 
                  onUpdate={handleUpdateTransaction} 
                  isLoading={loading}
                  filterType={filterType}
                />

                {filteredTransactions.length > 7 && (
                  <button 
                    onClick={() => setActiveTab('history')} 
                    className="w-full py-2.5 text-xs font-normal text-center text-[#533afd] dark:text-[#665efd] hover:underline cursor-pointer"
                  >
                    View All History ({filteredTransactions.length} items) →
                  </button>
                )}
              </div>
            </>
          )}

          {/* INSIGHTS TAB BENTO MOSAIC */}
          {activeTab === 'analysis' && (
            <>
              {/* Row 1: Spending Breakdown Donut Chart (3 cols) | Persistent Credit Score (3 cols) */}
              <SpendingBreakdownTile analysis={insightsAnalysis} className="md:col-span-2 lg:col-span-3" />
              {persistentCreditScoreTile}

              {/* Row 2: Daily Cap Tile (3 cols) | Last Saved Tile (3 cols) */}
              <DailyCapTile dailyCap={insightsAnalysis.dailyCap} className="md:col-span-1 lg:col-span-3" />
              <LastSavedTile lastSavingsTx={insightsAnalysis.lastSavingsTx} className="md:col-span-1 lg:col-span-3" />

              {/* Row 3: Per-Category Daily Budget Caps Tile (Full 6 cols) */}
              <CategoryBudgetsTile dailyCategoryTotals={insightsAnalysis.dailyCategoryTotals} className="md:col-span-2 lg:col-span-6" />

              {/* Row 4: Smart Guidance (Full 6 cols) */}
              <SmartGuidanceTile analysis={insightsAnalysis} className="md:col-span-2 lg:col-span-6" />
            </>
          )}

          {/* HISTORY TAB BENTO MOSAIC */}
          {activeTab === 'history' && (
            <>
              {/* Row 1: Persistent Credit Score (2 cols) | Total Income (2 cols) | Total Expenses (2 cols) */}
              {persistentCreditScoreTile}
              <TotalIncomeTile totalIncome={totalIncome} className="md:col-span-1 lg:col-span-2" />
              <TotalExpensesTile totalExpenses={totalExpenses} className="md:col-span-1 lg:col-span-2" />

              {/* Row 2: Full Transaction History Table (Full 6 cols - Add Transaction tile omitted) */}
              <div className="md:col-span-2 lg:col-span-6 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-light text-[#0d253d] dark:text-white tracking-tight">
                    Transaction History
                  </h2>
                </div>

                {/* Filter Pills, Search Bar & Secondary Actions */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
                    <div className="flex gap-1.5 p-1 bg-[#e3e8ee]/50 dark:bg-gray-800/60 rounded-full border border-[#e3e8ee] dark:border-gray-700 w-full md:w-auto">
                      {['all', 'expense', 'income'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-normal rounded-full capitalize transition-all cursor-pointer ${
                            filterType === type 
                              ? 'bg-[#533afd] text-white shadow-sm' 
                              : 'text-[#64748d] dark:text-gray-400 hover:text-[#0d253d]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Search Input in History */}
                    <div className="relative flex items-center w-full md:w-auto">
                      <FaSearch className="absolute left-3 text-xs text-[#64748d] dark:text-gray-400 pointer-events-none" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search note or category..."
                        className="w-full md:w-60 lg:w-52 pl-8 pr-3 py-1.5 text-xs font-normal bg-white dark:bg-gray-800/80 border border-[#e3e8ee] dark:border-gray-700 rounded-full text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={transactions.length === 0}
                      className="flex-1 sm:flex-none btn-stripe-secondary text-xs !py-1.5 !px-3 justify-center"
                      title="Export Transactions as PDF"
                    >
                      <FaFilePdf size={12} />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClearModal(true)}
                      disabled={transactions.length === 0}
                      className="flex-1 sm:flex-none btn-stripe-danger text-xs !py-1.5 !px-3 justify-center"
                      title="Clear All Transactions"
                    >
                      <FaTrashAlt size={11} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Full History Table */}
                <TransactionList 
                  transactions={filteredTransactions} 
                  onDelete={handleDeleteTransaction} 
                  onUpdate={handleUpdateTransaction} 
                  isLoading={loading}
                  filterType={filterType}
                />
              </div>
            </>
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#f6f9fc]/90 dark:bg-[#0b1329]/90 backdrop-blur-md border-t border-[#e3e8ee] dark:border-gray-800">
        <div className="flex justify-around items-center pt-3 pb-5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#533afd] dark:text-[#665efd]' : 'text-[#64748d] dark:text-gray-400'
            }`}
          >
            <FaHome size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'history' ? 'text-[#533afd] dark:text-[#665efd]' : 'text-[#64748d] dark:text-gray-400'
            }`}
          >
            <FaHistory size={18} />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'analysis' ? 'text-[#533afd] dark:text-[#665efd]' : 'text-[#64748d] dark:text-gray-400'
            }`}
          >
            <FaChartPie size={18} />
            <span className="text-[10px] font-medium">Insights</span>
          </button>
        </div>
      </div>

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

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-4 py-3 bg-[#0d253d] text-white rounded-xl shadow-xl flex items-center gap-2.5 border border-white/10">
            <FaCheckCircle className="text-[#059669] text-sm shrink-0" />
            <span className="text-xs font-normal">{successMsg}</span>
          </div>
        </div>
      )}

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
