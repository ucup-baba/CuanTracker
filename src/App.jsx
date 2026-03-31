import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, Wallet, Home, Download } from 'lucide-react';
import Marquee from './components/Marquee';
import Header from './components/Header';
import BalanceCards from './components/BalanceCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Login from './components/Login';
import Settings from './components/Settings';
import CategorySummary from './components/CategorySummary';
import AlertModal from './components/AlertModal';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import Calculator from './components/Calculator';
import CashMatchModal from './components/CashMatchModal';
import {
    defaultCategories, defaultIncomeCategories,
    defaultAsramaCategories, defaultAsramaIncomeCategories,
    WALLETS
} from './constants';
import { auth, db, collection, addDoc, deleteDoc, doc, setDoc, updateDoc, onSnapshot, query, orderBy, signOut } from './firebase';

export default function App() {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [activeWallet, setActiveWallet] = useState('all'); // 'all' | 'pribadi' | 'asrama'
    const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
    const [activeSummary, setActiveSummary] = useState(null); // 'income' | 'expense' | null
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // State untuk pencarian
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
    const [toast, setToast] = useState({ isOpen: false, message: '' });

    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);

    // Cash Match (Opname Kas) State
    const [showCashMatch, setShowCashMatch] = useState(false);
    const [cashMatches, setCashMatches] = useState([]);

    // Unsaved settings tracking
    const [isSettingsDirty, setIsSettingsDirty] = useState(false);
    const [unsavedNav, setUnsavedNav] = useState(null); // To hold pending navigation path

    const navigate = useNavigate(); // Hook untuk navigasi
    const location = useLocation(); // Hook untuk path saat ini

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
            data.sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return (b.createdAt || 0) - (a.createdAt || 0);
            });
            setTransactions(data);
        });

        // Ambil data riwayat cash match
        const qMatch = query(collection(db, 'globalCashMatches'));
        const unsubscribeMatch = onSnapshot(qMatch, (snapshot) => {
            const matchData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            matchData.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort latest first
            setCashMatches(matchData);
        });

        return () => {
            unsubscribe();
            unsubscribeMatch();
        };
    }, [user]);

    const handleLogoClick = (e) => {
        if (location.pathname === '/settings' && isSettingsDirty) {
            e.preventDefault();
            setUnsavedNav('/');
        }
    };

    // Firestore listeners for all category documents
    useEffect(() => {
        if (!user) return;
        const unsubs = [];
        let loaded = { pe: false, pi: false, ae: false, ai: false };

        const checkAllLoaded = () => {
            if (loaded.pe && loaded.pi && loaded.ae && loaded.ai) {
                setLoadingSettings(false);
            }
        };

        // Pribadi expense
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'categories'), (snap) => {
            setPribadiCategories(snap.exists() ? snap.data() : defaultCategories);
            if (!loaded.pe) { loaded.pe = true; checkAllLoaded(); }
        }));
        // Pribadi income
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'incomeCategories'), (snap) => {
            setPribadiIncomeCategories(snap.exists() ? snap.data() : defaultIncomeCategories);
            if (!loaded.pi) { loaded.pi = true; checkAllLoaded(); }
        }));
        // Asrama expense
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaCategories'), (snap) => {
            setAsramaCategories(snap.exists() ? snap.data() : defaultAsramaCategories);
            if (!loaded.ae) { loaded.ae = true; checkAllLoaded(); }
        }));
        // Asrama income
        unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaIncomeCategories'), (snap) => {
            setAsramaIncomeCategories(snap.exists() ? snap.data() : defaultAsramaIncomeCategories);
            if (!loaded.ai) { loaded.ai = true; checkAllLoaded(); }
        }));

        return () => unsubs.forEach(u => u());
    }, [user]);

    // PWA Install Prompt Listener
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault(); // Mencegah mini-infobar default muncul
            setDeferredPrompt(e); // Simpan event untuk di-trigger nanti
            setShowInstallBanner(true); // Tampilkan UI kustom kita
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Jika PWA sudah terinstall, sembunyikan banner
        window.addEventListener('appinstalled', () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                setShowInstallBanner(false);
            }
            setDeferredPrompt(null);
        });
    };

    // Filter transaksi berdasarkan wallet aktif & hitung totals
    const { filteredTransactions, totalBalance, totalIncome, totalExpense, totalTransfer } = useMemo(() => {
        let filtered = transactions;

        if (activeWallet !== 'all') {
            filtered = transactions.filter(t => {
                if (t.type === 'transfer') {
                    return t.fromWallet === activeWallet || t.toWallet === activeWallet;
                }
                return t.wallet === activeWallet;
            });
        }

        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(t => {
                const txDate = new Date(t.date);
                if (dateFilter === 'today') {
                    return txDate.toDateString() === now.toDateString();
                } else if (dateFilter === 'week') {
                    const diffTime = Math.abs(now - txDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                } else if (dateFilter === 'month') {
                    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
                }
                return true;
            });
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => {
                const textMatch = t.text?.toLowerCase().includes(query);
                const categoryMatch = t.category?.toLowerCase().includes(query);
                const subCategoryMatch = t.subCategory?.toLowerCase().includes(query);
                return textMatch || categoryMatch || subCategoryMatch;
            });
        }

        let income = 0;
        let expense = 0;
        let transfer = 0;

        filtered.forEach(t => {
            if (t.type === 'transfer') {
                transfer += t.amount;
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
            totalExpense: expense,
            totalTransfer: transfer
        };
    }, [transactions, activeWallet, dateFilter, searchQuery]);

    // Tambah transaksi baru
    const addTransaction = async (newTransaction) => {
        try {
            const { id, ...transactionData } = newTransaction;
            transactionData.createdAt = Date.now();
            await addDoc(collection(db, 'globalTransactions'), transactionData);
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal menyimpan transaksi: ' + error.message });
        }
    };

    // Tambah log pencocokan kas
    const addCashMatchLog = async (newMatch) => {
        try {
            const { id, ...matchData } = newMatch;
            await addDoc(collection(db, 'globalCashMatches'), matchData);
            setToast({ isOpen: true, message: 'Sip Bos! Pengecekan saldo telah dicatat di database.' });
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal menyimpan riwayat cek saldo: ' + error.message });
        }
    };

    // Update transaksi
    const updateTransaction = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'globalTransactions', id), updatedData);
            setEditingTransaction(null);
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal mengupdate transaksi: ' + error.message });
        }
    };

    // Hapus transaksi
    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'globalTransactions', id));
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal menghapus transaksi: ' + error.message });
        }
    };

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
            setToast({ isOpen: true, message: 'Mantap Bos! Kategori berhasil disimpan.' });
            setIsSettingsDirty(false); // Clear dirty state
            // Toast automatically vanishes, navigate slightly before it disappears
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal menyimpan kategori: ' + error.message });
        }
    };

    // Handle Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal logout: ' + error.message });
        }
    };

    // Helper: get categories based on wallet + type
    const getCategoriesForWallet = (walletId, type) => {
        if (walletId === 'asrama') {
            return type === 'income' ? asramaIncomeCategories : asramaCategories;
        }
        return type === 'income' ? pribadiIncomeCategories : pribadiCategories;
    };

    // 1. First, wait for authentication to finish checking
    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-pink-100 flex flex-col items-center justify-center font-sans p-6" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#fdf2f8' }}>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-10 animate-bounce">
                    <div className="absolute inset-0 bg-indigo-400 border-4 border-black pop-shadow-sm transform rotate-[15deg]"></div>
                    <div className="absolute inset-0 bg-white border-4 border-black pop-shadow flex items-center justify-center transform -rotate-[5deg]">
                        <Wallet size={40} className="text-black animate-pulse" strokeWidth={3} />
                    </div>
                </div>
                <div className="bg-white border-4 border-black pop-shadow px-4 sm:px-6 py-2 sm:py-3 transform rotate-[-2deg]">
                    <h1 className="text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tighter text-center animate-pulse whitespace-nowrap">
                        Memeriksa Bos...
                    </h1>
                </div>
            </div>
        );
    }

    // 2. If no user is found after auth check, show Login screen
    if (!user) {
        return <Login />;
    }

    // 3. If user is logged in, wait for their settings data to load
    if (loadingSettings) {
        return (
            <div className="min-h-screen bg-pink-100 flex flex-col items-center justify-center font-sans p-6" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#fdf2f8' }}>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-10 animate-bounce" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute inset-0 bg-yellow-400 border-4 border-black pop-shadow-sm transform rotate-[15deg]"></div>
                    <div className="absolute inset-0 bg-white border-4 border-black pop-shadow flex items-center justify-center transform -rotate-[5deg]">
                        <DollarSign size={40} className="text-black animate-pulse" strokeWidth={3} />
                    </div>
                </div>
                <div className="bg-white border-4 border-black pop-shadow px-4 sm:px-6 py-2 sm:py-3 transform rotate-[2deg]">
                    <h1 className="text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tighter text-center animate-pulse whitespace-nowrap">
                        Menyiapkan Data...
                    </h1>
                </div>
            </div>
        );
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
                onOpenSettings={() => {
                    if (location.pathname !== '/settings') navigate('/settings');
                }}
                onLogoClick={handleLogoClick}
                onOpenCalculator={() => setShowCalculator(true)}
                onOpenCashMatch={() => setShowCashMatch(true)}
            />

            <Marquee text="AWAS KANKER (KANTONG KERING)" bg="bg-red-500" textCol="text-black" />

            <div className="pb-20">
                <Routes>
                    <Route path="/settings" element={
                        <main className="container mx-auto px-6 mt-12">
                            <Settings
                                pribadiCategories={pribadiCategories}
                                pribadiIncomeCategories={pribadiIncomeCategories}
                                asramaCategories={asramaCategories}
                                asramaIncomeCategories={asramaIncomeCategories}
                                onSaveCategories={saveCategoriesForWallet}
                                onBack={(path = '/') => {
                                    if (isSettingsDirty) {
                                        setUnsavedNav(path);
                                    } else {
                                        navigate(path);
                                    }
                                }}
                                setDirty={setIsSettingsDirty}
                            />
                        </main>
                    } />

                    <Route path="/" element={
                        <>
                            {/* Wallet Switcher */}
                            <div className="bg-white border-b-4 border-black">
                                <div className="container mx-auto px-6 flex gap-0">
                                    <button
                                        onClick={() => setActiveWallet('all')}
                                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 border-r-4 border-black transition-all ${activeWallet === 'all' ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <span className={`p-1.5 border-3 ${activeWallet === 'all' ? 'border-white bg-white text-black' : 'border-gray-300 bg-white text-gray-400'}`}>
                                            <DollarSign size={18} strokeWidth={3} />
                                        </span>
                                        Semua
                                    </button>
                                    <button
                                        onClick={() => setActiveWallet('pribadi')}
                                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 border-r-4 border-black transition-all ${activeWallet === 'pribadi' ? 'bg-yellow-400 text-black pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <span className={`p-1.5 border-3 ${activeWallet === 'pribadi' ? 'border-black bg-white text-yellow-600' : 'border-gray-300 bg-white text-gray-400'}`}>
                                            <Wallet size={18} strokeWidth={3} />
                                        </span>
                                        Pribadi
                                    </button>
                                    <button
                                        onClick={() => setActiveWallet('asrama')}
                                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${activeWallet === 'asrama' ? 'bg-indigo-400 text-white pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <span className={`p-1.5 border-3 ${activeWallet === 'asrama' ? 'border-black bg-white text-indigo-600' : 'border-gray-300 bg-white text-gray-400'}`}>
                                            <Home size={18} strokeWidth={3} />
                                        </span>
                                        Asrama
                                    </button>
                                </div>
                            </div>

                            <main className="container mx-auto px-6 mt-12">
                                <BalanceCards
                                    totalBalance={totalBalance}
                                    totalIncome={totalIncome}
                                    totalExpense={totalExpense}
                                    totalTransfer={totalTransfer}
                                    activeWallet={activeWallet}
                                    onToggleSummary={(type) => setActiveSummary(prev => prev === type ? null : type)}
                                    activeSummary={activeSummary}
                                />

                                {activeSummary && (
                                    <CategorySummary
                                        transactions={filteredTransactions}
                                        type={activeSummary}
                                        onClose={() => setActiveSummary(null)}
                                        getCategoriesForWallet={getCategoriesForWallet}
                                        activeWallet={activeWallet}
                                    />
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <section>
                                        <TransactionForm
                                            onAddTransaction={addTransaction}
                                            onUpdateTransaction={updateTransaction}
                                            getCategoriesForWallet={getCategoriesForWallet}
                                            activeWallet={activeWallet}
                                            editingTransaction={editingTransaction}
                                            setEditingTransaction={setEditingTransaction}
                                        />
                                    </section>

                                    <section>
                                        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 mt-2 xl:mt-0">
                                            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter bg-white inline-block px-4 py-2 border-4 border-black pop-shadow-sm rotate-[-2deg]">Dosa & Pahala</h2>

                                            {/* Filter Tanggal */}
                                            <div className="flex flex-wrap gap-2 pb-2">
                                                {['all', 'today', 'week', 'month'].map(f => (
                                                    <button
                                                        key={f}
                                                        onClick={() => setDateFilter(f)}
                                                        className={`px-3 py-2 border-2 border-black font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-transform ${dateFilter === f ? 'bg-black text-white pop-shadow-sm translate-x-1 z-10' : 'bg-white text-gray-500 hover:bg-gray-100 hover:-translate-y-1'}`}
                                                    >
                                                        {f === 'all' ? 'Semua Waktu' : f === 'today' ? 'Hari Ini' : f === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <TransactionList
                                            transactions={filteredTransactions}
                                            deleteTransaction={deleteTransaction}
                                            setEditingTransaction={setEditingTransaction}
                                            getCategoriesForWallet={getCategoriesForWallet}
                                            activeWallet={activeWallet}
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                        />
                                    </section>
                                </div>
                            </main>
                        </>
                    } />
                </Routes>
            </div>

            {/* PWA Install Banner kustom diletakkan di bawah sticky footer jika ada */}
            {showInstallBanner && (
                <div className="fixed bottom-0 left-0 right-0 bg-yellow-400 border-t-8 border-black p-4 z-50 flex items-center justify-between shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
                    <div className="flex-1">
                        <h3 className="font-black uppercase text-xl text-black">INSTALL CUANTRACKER.</h3>
                        <p className="font-bold text-black text-sm pr-4 limit-2-lines">Akses lebih cepat & tanpa url bar! Tambahkan ke layar utama bos.</p>
                    </div>
                    <button
                        onClick={handleInstallClick}
                        className="bg-black text-white font-black uppercase px-4 py-3 border-4 border-black hover:bg-white hover:text-black transition-colors pop-shadow-sm flex items-center gap-2 shrink-0"
                    >
                        <Download size={20} strokeWidth={3} />
                        Install
                    </button>
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="absolute -top-4 right-4 bg-white border-4 border-black p-1 hover:bg-gray-100 font-bold"
                    >
                        X
                    </button>
                </div>
            )}

            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                onClose={() => setToast({ isOpen: false, message: '' })}
            />

            <Calculator
                isOpen={showCalculator}
                onClose={() => setShowCalculator(false)}
            />

            <CashMatchModal
                isOpen={showCashMatch}
                onClose={() => setShowCashMatch(false)}
                totalBalance={totalBalance}
                cashMatches={cashMatches}
                onAddMatch={addCashMatchLog}
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                message={alertModal.message}
                onClose={() => setAlertModal({ isOpen: false, message: '' })}
            />

            <ConfirmModal
                isOpen={unsavedNav !== null}
                title="PERINGATAN!"
                message="Ada editan kategori yang belum disimpan Bos. Yakin mau pindah? (Editan bakal hangus lho!)"
                cancelText="KEMBALI KE EDITOR"
                confirmText="YAKIN, HANGUSKAN"
                onCancel={() => setUnsavedNav(null)}
                onConfirm={() => {
                    setIsSettingsDirty(false);
                    navigate(unsavedNav);
                    setUnsavedNav(null);
                }}
            />
        </div>
    );
}
