import React, { useState, useEffect, useMemo } from 'react';
import Marquee from './components/Marquee';
import Header from './components/Header';
import BalanceCards from './components/BalanceCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Login from './components/Login';
import Settings from './components/Settings';
import {
    defaultCategories, defaultIncomeCategories,
    defaultAsramaCategories, defaultAsramaIncomeCategories,
    WALLETS
} from './constants';
import { auth, db, collection, addDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy, signOut } from './firebase';

export default function App() {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [activeWallet, setActiveWallet] = useState('all'); // 'all' | 'pribadi' | 'asrama'

    // Kategori per wallet
    const [pribadiCategories, setPribadiCategories] = useState(defaultCategories);
    const [pribadiIncomeCategories, setPribadiIncomeCategories] = useState(defaultIncomeCategories);
    const [asramaCategories, setAsramaCategories] = useState(defaultAsramaCategories);
    const [asramaIncomeCategories, setAsramaIncomeCategories] = useState(defaultAsramaIncomeCategories);

    // Pantau status login user
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    // Ambil data transaksi secara real-time dari Firestore
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'globalTransactions'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [user]);

    // Firestore listeners for all category documents
    useEffect(() => {
        if (!user) return;
        const unsubs = [];

        // Pribadi expense
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'categories'), (snap) => {
            setPribadiCategories(snap.exists() ? snap.data() : defaultCategories);
        }));
        // Pribadi income
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'incomeCategories'), (snap) => {
            setPribadiIncomeCategories(snap.exists() ? snap.data() : defaultIncomeCategories);
        }));
        // Asrama expense
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaCategories'), (snap) => {
            setAsramaCategories(snap.exists() ? snap.data() : defaultAsramaCategories);
        }));
        // Asrama income
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaIncomeCategories'), (snap) => {
            setAsramaIncomeCategories(snap.exists() ? snap.data() : defaultAsramaIncomeCategories);
        }));

        return () => unsubs.forEach(u => u());
    }, [user]);

    // Filter transaksi berdasarkan wallet aktif & hitung totals
    const { filteredTransactions, totalBalance, totalIncome, totalExpense } = useMemo(() => {
        let filtered = transactions;

        if (activeWallet !== 'all') {
            filtered = transactions.filter(t => {
                if (t.type === 'transfer') {
                    return t.fromWallet === activeWallet || t.toWallet === activeWallet;
                }
                return t.wallet === activeWallet;
            });
        }

        let income = 0;
        let expense = 0;

        filtered.forEach(t => {
            if (t.type === 'transfer') {
                if (activeWallet === 'all') {
                    // Dalam "Semua", transfer tidak mengubah total
                } else if (t.fromWallet === activeWallet) {
                    expense += t.amount;
                } else if (t.toWallet === activeWallet) {
                    income += t.amount;
                }
            } else if (t.type === 'income') {
                income += t.amount;
            } else {
                expense += t.amount;
            }
        });

        return {
            filteredTransactions: filtered,
            totalBalance: income - expense,
            totalIncome: income,
            totalExpense: expense
        };
    }, [transactions, activeWallet]);

    // Tambah transaksi baru
    const addTransaction = async (newTransaction) => {
        try {
            const { id, ...transactionData } = newTransaction;
            await addDoc(collection(db, 'globalTransactions'), transactionData);
        } catch (error) {
            alert('Gagal menyimpan transaksi: ' + error.message);
        }
    };

    // Hapus transaksi
    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'globalTransactions', id));
        } catch (error) {
            alert('Gagal menghapus transaksi: ' + error.message);
        }
    };

    // Simpan kategori per wallet
    const saveCategoriesForWallet = async (walletId, tabType, updatedCategories) => {
        const docMap = {
            'pribadi-expense': 'categories',
            'pribadi-income': 'incomeCategories',
            'asrama-expense': 'asramaCategories',
            'asrama-income': 'asramaIncomeCategories',
        };
        const docName = docMap[`${walletId}-${tabType}`];
        if (!docName) return;
        try {
            await setDoc(doc(db, 'globalSettings', docName), updatedCategories);
            setCurrentView('dashboard');
        } catch (error) {
            alert('Gagal menyimpan kategori: ' + error.message);
        }
    };

    // Handle Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            alert('Gagal logout: ' + error.message);
        }
    };

    // Helper: get categories based on wallet + type
    const getCategoriesForWallet = (walletId, type) => {
        if (walletId === 'asrama') {
            return type === 'income' ? asramaIncomeCategories : asramaCategories;
        }
        return type === 'income' ? pribadiIncomeCategories : pribadiCategories;
    };

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-pink-100 flex items-center justify-center font-sans">
                <h1 className="text-4xl font-black uppercase tracking-tighter animate-pulse">Memeriksa Keaslian Bos...</h1>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-pink-100 font-sans selection:bg-black selection:text-yellow-400 pb-20">
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&display=swap');
        
        body {
          font-family: 'Archivo', sans-serif;
          background-image: radial-gradient(#000 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: #fdf2f8;
        }
        
        .border-text {
          -webkit-text-stroke: 2px currentColor;
        }

        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        .animate-marquee2 {
          animation: marquee2 15s linear infinite;
        }
        
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0%); }
        }
        
        .pop-shadow {
          box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
          transition: all 0.2s ease-in-out;
        }
        .pop-shadow:hover {
          box-shadow: 12px 12px 0px 0px rgba(0,0,0,1);
          transform: translate(-4px, -4px);
        }
        .pop-shadow-sm {
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
        }
      `}} />

            <Header
                onLogout={handleLogout}
                userEmail={user.email}
                onOpenSettings={() => setCurrentView('settings')}
                activeWallet={activeWallet}
                onWalletChange={setActiveWallet}
            />

            <Marquee text="AWAS KANKER (KANTONG KERING)" bg="bg-red-500" textCol="text-black" />

            <main className="container mx-auto px-6 mt-12">
                {currentView === 'settings' ? (
                    <Settings
                        pribadiCategories={pribadiCategories}
                        pribadiIncomeCategories={pribadiIncomeCategories}
                        asramaCategories={asramaCategories}
                        asramaIncomeCategories={asramaIncomeCategories}
                        onSaveCategories={saveCategoriesForWallet}
                        onBack={() => setCurrentView('dashboard')}
                    />
                ) : (
                    <>
                        <BalanceCards
                            totalBalance={totalBalance}
                            totalIncome={totalIncome}
                            totalExpense={totalExpense}
                            activeWallet={activeWallet}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <section>
                                <TransactionForm
                                    onAddTransaction={addTransaction}
                                    getCategoriesForWallet={getCategoriesForWallet}
                                    activeWallet={activeWallet}
                                />
                            </section>

                            <section>
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 bg-white inline-block px-6 py-2 border-4 border-black pop-shadow-sm rotate-[-2deg]">Daftar Dosa & Pahala</h2>
                                <TransactionList
                                    transactions={filteredTransactions}
                                    deleteTransaction={deleteTransaction}
                                    getCategoriesForWallet={getCategoriesForWallet}
                                    activeWallet={activeWallet}
                                />
                            </section>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
