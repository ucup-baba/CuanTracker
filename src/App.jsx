import React, { useState, useEffect, useMemo } from 'react';
import Marquee from './components/Marquee';
import Header from './components/Header';
import BalanceCards from './components/BalanceCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Login from './components/Login';
import Settings from './components/Settings';
import { defaultCategories, defaultIncomeCategories } from './constants';
import { auth, db, collection, addDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy, signOut } from './firebase';

export default function App() {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState(defaultCategories);
    const [incomeCategories, setIncomeCategories] = useState(defaultIncomeCategories);
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'settings'
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Pantau status login user
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    // Ambil data transaksi secara real-time dari Firestore (Global Database)
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'globalTransactions'),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Urutkan manual berdasarkan tanggal karena di UI kita butuh urutan yang stabil jika tanggalnya sama
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(data);
        });

        return () => unsubscribe();
    }, [user]);

    // Ambil data kategori pengeluaran dari Firestore
    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'globalSettings', 'categories'), (snapshot) => {
            if (snapshot.exists()) {
                setCategories(snapshot.data());
            } else {
                setCategories(defaultCategories);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Ambil data kategori pemasukan dari Firestore
    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'globalSettings', 'incomeCategories'), (snapshot) => {
            if (snapshot.exists()) {
                setIncomeCategories(snapshot.data());
            } else {
                setIncomeCategories(defaultIncomeCategories);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Kalkulasi total dengan useMemo (Optimasi Performa)
    const { totalBalance, totalIncome, totalExpense } = useMemo(() => {
        const amounts = transactions.map(transaction =>
            transaction.type === 'income' ? transaction.amount : -transaction.amount
        );
        const balance = amounts.reduce((acc, item) => (acc += item), 0);

        const income = transactions
            .filter(item => item.type === 'income')
            .reduce((acc, item) => (acc += item.amount), 0);

        const expense = transactions
            .filter(item => item.type === 'expense')
            .reduce((acc, item) => (acc += item.amount), 0);

        return {
            totalBalance: balance,
            totalIncome: income,
            totalExpense: expense
        };
    }, [transactions]);

    // Handle submit form (Simpan ke Firestore)
    const addTransaction = async (newTransaction) => {
        try {
            // Hapus ID bawaan dari parameter karena Firestore akan generate ID unik otomatis
            const { id, ...transactionData } = newTransaction;
            await addDoc(collection(db, 'globalTransactions'), transactionData);
        } catch (error) {
            alert('Gagal menyimpan transaksi: ' + error.message);
        }
    };

    // Handle hapus transaksi dari Firestore
    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'globalTransactions', id));
        } catch (error) {
            alert('Gagal menghapus transaksi: ' + error.message);
        }
    };

    // Handle Simpan Kategori Pengeluaran ke Firestore
    const saveCategories = async (updatedCategories) => {
        try {
            await setDoc(doc(db, 'globalSettings', 'categories'), updatedCategories);
            setCurrentView('dashboard');
        } catch (error) {
            alert('Gagal menyimpan pengaturan kategori: ' + error.message);
        }
    };

    // Handle Simpan Kategori Pemasukan ke Firestore
    const saveIncomeCategories = async (updatedCategories) => {
        try {
            await setDoc(doc(db, 'globalSettings', 'incomeCategories'), updatedCategories);
            setCurrentView('dashboard');
        } catch (error) {
            alert('Gagal menyimpan pengaturan kategori pemasukan: ' + error.message);
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
          /* Pola grid background khas komik/pop-art */
          background-image: radial-gradient(#000 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: #fdf2f8; /* pink-50 */
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

            {/* Header dengan navigasi Settings & Logout */}
            <Header
                onLogout={handleLogout}
                userEmail={user.email}
                onOpenSettings={() => setCurrentView('settings')}
            />

            {/* Marquee Peringatan */}
            <Marquee text="AWAS KANKER (KANTONG KERING)" bg="bg-red-500" textCol="text-black" />

            <main className="container mx-auto px-6 mt-12">
                {currentView === 'settings' ? (
                    <Settings
                        categories={categories}
                        onSaveCategories={saveCategories}
                        incomeCategories={incomeCategories}
                        onSaveIncomeCategories={saveIncomeCategories}
                        onBack={() => setCurrentView('dashboard')}
                    />
                ) : (
                    <>
                        {/* Ringkasan Saldo (Hero Stats) */}
                        <BalanceCards
                            totalBalance={totalBalance}
                            totalIncome={totalIncome}
                            totalExpense={totalExpense}
                        />

                        {/* Area Utama: Form & Histori */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Form Tambah Transaksi */}
                            <section>
                                <TransactionForm
                                    onAddTransaction={addTransaction}
                                    categories={categories}
                                    incomeCategories={incomeCategories}
                                />
                            </section>

                            {/* Daftar Histori Transaksi */}
                            <section>
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 bg-white inline-block px-6 py-2 border-4 border-black pop-shadow-sm rotate-[-2deg]">Daftar Dosa & Pahala</h2>
                                <TransactionList
                                    transactions={transactions}
                                    deleteTransaction={deleteTransaction}
                                    categories={categories}
                                    incomeCategories={incomeCategories}
                                />
                            </section>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
