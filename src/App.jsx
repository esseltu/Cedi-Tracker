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
  SmartGuidanceTile 
} from './components/FeedbackCard';
import Login from './components/Login';
import IncomeSuggestionModal from './components/IncomeSuggestionModal';
import ClearTransactionsModal from './components/ClearTransactionsModal';
import { exportTransactionsToPdf } from './utils/exportPdf';
import { FaHistory, FaChartPie, FaSignOutAlt, FaMoon, FaSun, FaFilePdf, FaTrashAlt } from 'react-icons/fa';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, updateDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
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

  // Persistent Credit Score Tile (mounted once at App level)
  const persistentCreditScoreTile = (
    <CreditScoreTile 
      key="persistent-credit-score-tile"
      creditScore={creditScore} 
      className={activeTab === 'history' ? 'lg:col-span-2' : 'lg:col-span-3'} 
    />
  );

  return (
    <div className="min-h-screen pb-24 max-w-md lg:max-w-[1200px] mx-auto relative px-4 sm:px-6 lg:px-8 lg:py-6">
      {/* Top Bar */}
      <header className="pt-6 lg:pt-0 pb-4 flex justify-between items-center sticky top-0 z-30 bg-[#f6f9fc]/90 dark:bg-[#0b1329]/90 backdrop-blur-md mb-4 lg:mb-8 border-b border-[#e3e8ee] dark:border-gray-800">
        <div>
          <h1 className="text-xl lg:text-2xl font-light text-[#0d253d] dark:text-white tracking-tight">
            Cedi Tracker
          </h1>
          <p className="text-xs text-[#64748d] dark:text-gray-400 font-normal">
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

      {/* Main Bento Grid Mosaic Container */}
      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 items-stretch">
          
          {/* DASHBOARD TAB BENTO MOSAIC */}
          {activeTab === 'dashboard' && (
            <>
              {/* Row 1: Cedi Card Hero Tile (3 cols) | Credit Score (3 cols) - Equal 50/50 split */}
              <CediCardTile 
                balance={balance} 
                cardHolder={user?.displayName || 'YOU'} 
                className="lg:col-span-3" 
              />
              {persistentCreditScoreTile}

              {/* Row 2: Add Transaction (2 cols) | Total Income (2 cols) | Total Expenses (2 cols) */}
              <AddTransactionTile 
                onAddClick={() => setShowAddModal(true)} 
                className="lg:col-span-2" 
              />
              <TotalIncomeTile totalIncome={totalIncome} className="lg:col-span-2" />
              <TotalExpensesTile totalExpenses={totalExpenses} className="lg:col-span-2" />

              {/* Row 3: Low Funds Warning Banner Tile (Full 6 cols) */}
              <LowFundsBannerTile 
                balance={balance} 
                creditScore={creditScore} 
                transactions={transactions} 
                className="lg:col-span-6" 
              />

              {/* Row 4: Recent Transactions Table Tile (Full 6 cols) */}
              <div className="lg:col-span-6 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-light text-[#0d253d] dark:text-white tracking-tight">
                    Recent Transactions
                  </h2>

                  {/* Mobile Tab Toggle Buttons */}
                  <div className="flex lg:hidden items-center gap-1.5">
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="btn-stripe-icon"
                      title="History View"
                    >
                      <FaHistory size={13} />
                    </button>
                    <button 
                      onClick={() => setActiveTab('analysis')}
                      className="btn-stripe-icon"
                      title="Insights View"
                    >
                      <FaChartPie size={13} />
                    </button>
                  </div>
                </div>

                {/* Filter Pills & Secondary Actions */}
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

                {/* Table Content */}
                <TransactionList 
                  transactions={filteredTransactions.slice(0, 7)} 
                  onDelete={handleDeleteTransaction} 
                  onUpdate={handleUpdateTransaction} 
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
              <SpendingBreakdownTile analysis={insightsAnalysis} className="lg:col-span-3" />
              {persistentCreditScoreTile}

              {/* Row 2: Daily Cap Tile (3 cols) | Last Saved Tile (3 cols) */}
              <DailyCapTile dailyCap={insightsAnalysis.dailyCap} className="lg:col-span-3" />
              <LastSavedTile lastSavingsTx={insightsAnalysis.lastSavingsTx} className="lg:col-span-3" />

              {/* Row 3: Smart Guidance (Full 6 cols - Add Transaction tile omitted) */}
              <SmartGuidanceTile analysis={insightsAnalysis} className="lg:col-span-6" />
            </>
          )}

          {/* HISTORY TAB BENTO MOSAIC */}
          {activeTab === 'history' && (
            <>
              {/* Row 1: Persistent Credit Score (2 cols) | Total Income (2 cols) | Total Expenses (2 cols) */}
              {persistentCreditScoreTile}
              <TotalIncomeTile totalIncome={totalIncome} className="lg:col-span-2" />
              <TotalExpensesTile totalExpenses={totalExpenses} className="lg:col-span-2" />

              {/* Row 2: Full Transaction History Table (Full 6 cols - Add Transaction tile omitted) */}
              <div className="lg:col-span-6 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-light text-[#0d253d] dark:text-white tracking-tight">
                    Transaction History
                  </h2>
                </div>

                {/* Filter Pills & Secondary Actions */}
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

                {/* Full History Table */}
                <TransactionList 
                  transactions={filteredTransactions} 
                  onDelete={handleDeleteTransaction} 
                  onUpdate={handleUpdateTransaction} 
                />
              </div>
            </>
          )}

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
