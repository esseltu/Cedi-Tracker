import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import TransactionList from './components/TransactionList';
import FeedbackCard from './components/FeedbackCard';
import Login from './components/Login';
import { FaHistory, FaChartPie, FaSignOutAlt } from 'react-icons/fa';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, history, analysis
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [showAddModal, setShowAddModal] = useState(false);

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
        setLoading(false); // Stop loading if no user (show login)
      }
    });
    return () => unsubscribe();
  }, []);

  // Load Transactions from Firestore (Only if user is logged in)
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    // Query only this user's transactions
    // We removed orderBy to avoid index errors. We sort client-side.
    const q = query(
      collection(db, 'transactions'), 
      where('uid', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTransactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      // Client-side sort: Date desc, then CreatedAt desc
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
      setLoading(false); // Data loaded
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
        uid: user.uid, // Attach User ID
        createdAt: Timestamp.now()
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to save transaction. Check internet connection.");
    }
  };

  const handleDeleteTransaction = async (id) => {
    // 1. Immediate UI Feedback (Optimistic Update)
    const originalTransactions = [...transactions];
    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      // 2. Perform Delete
      await deleteDoc(doc(db, 'transactions', id));
      console.log("Document deleted successfully from Firestore");
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert(`Failed to delete: ${e.message}`);
      // 3. Revert on Error
      setTransactions(originalTransactions);
    }
  };

  if (loading) {
    return <SplashScreen onComplete={() => {}} />; // Keep splash until auth/data decides
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 z-30 bg-gray-100/80 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Cedi Tracker</h1>
          <p className="text-xs text-gray-500">Welcome, {user.displayName?.split(' ')[0] || 'Chief'}</p>
        </div>
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-emerald-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
              {user.email?.[0].toUpperCase() || 'U'}
            </div>
          )}
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-6">
        <Dashboard 
          balance={balance} 
          creditScore={creditScore} 
          onAddClick={() => setShowAddModal(true)} 
        />

        {/* Tab Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Recent Transactions' : activeTab === 'analysis' ? 'Insights' : 'History'}
            </h2>
            
            {/* Simple Tab Toggle */}
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`p-1.5 rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
              >
                <FaHistory size={14} />
              </button>
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`p-1.5 rounded-md transition-all ${activeTab === 'analysis' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
              >
                <FaChartPie size={14} />
              </button>
            </div>
          </div>

          {/* Filters */}
          {(activeTab === 'dashboard' || activeTab === 'history') && (
            <div className="flex gap-2">
              {['all', 'expense', 'income'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full capitalize transition-all ${
                    filterType === type 
                      ? 'bg-gray-800 text-white shadow-md' 
                      : 'bg-white text-gray-500 border border-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <TransactionList transactions={filteredTransactions.slice(0, 5)} onDelete={handleDeleteTransaction} />
              {filteredTransactions.length > 5 && (
                <button onClick={() => setActiveTab('history')} className="w-full py-2 text-sm text-center text-gray-500 hover:text-emerald-600">
                  View All
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
      </main>

      {/* Add Transaction Modal */}
      <AddTransaction 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleAddTransaction} 
      />
    </div>
  );
}

export default App;
