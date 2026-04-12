import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, Wallet, Home, Download, Shield, Clock, Ban } from 'lucide-react';
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
import MonthlyComparison from './components/MonthlyComparison';
import DebtModal from './components/DebtModal';
import PengurusDashboard from './components/PengurusDashboard';
import PengurusAccountManager from './components/PengurusAccountManager';
import {
    defaultCategories, defaultIncomeCategories,
    defaultAsramaCategories, defaultAsramaIncomeCategories,
    defaultPutriCategories, defaultPutriIncomeCategories,
    WALLETS, ROLE_CONFIG, getRoleFromEmail, ADMIN_EMAIL
} from './constants';
import { auth, db, collection, addDoc, deleteDoc, doc, setDoc, updateDoc, onSnapshot, query, orderBy, getDoc, serverTimestamp, signOut } from './firebase';

export default function App() {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [activeWallet, setActiveWallet] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [activeSummary, setActiveSummary] = useState(null);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
    const [toast, setToast] = useState({ isOpen: false, message: '' });

    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [showCashMatch, setShowCashMatch] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [showPengurusComparison, setShowPengurusComparison] = useState(false);
    const [showDebt, setShowDebt] = useState(false);
    const [cashMatches, setCashMatches] = useState([]);

    // Debt State
    const [showDebtModal, setShowDebtModal] = useState(false);
    const [debts, setDebts] = useState([]);

    // Pengurus access control
    const [pengurusStatus, setPengurusStatus] = useState(null); // null | 'loading' | 'pending' | 'approved' | 'blocked'
    const [showAccountManager, setShowAccountManager] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Unsaved settings tracking
    const [isSettingsDirty, setIsSettingsDirty] = useState(false);
    const [unsavedNav, setUnsavedNav] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    // === ROLE DETECTION ===
    const userRole = useMemo(() => getRoleFromEmail(user?.email), [user?.email]);
    const roleConfig = useMemo(() => userRole ? ROLE_CONFIG[userRole] : null, [userRole]);
    const theme = roleConfig?.theme || ROLE_CONFIG.putra.theme;
    const isAdmin = user?.email === ADMIN_EMAIL;

    // Pengurus access control: check/register user in pengurusUsers collection
    useEffect(() => {
        if (!user || userRole !== 'pengurus') {
            setPengurusStatus(null);
            return;
        }

        // Admin is always auto-approved
        if (isAdmin) {
            setPengurusStatus('approved');
            return;
        }

        setPengurusStatus('loading');
        const userDocRef = doc(db, 'pengurusUsers', user.uid);

        // Listen for real-time status changes
        const unsub = onSnapshot(userDocRef, async (snap) => {
            if (snap.exists()) {
                setPengurusStatus(snap.data().status);
            } else {
                // Register new user as pending
                try {
                    await setDoc(userDocRef, {
                        email: user.email,
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        status: 'pending',
                        requestedAt: serverTimestamp()
                    });
                    setPengurusStatus('pending');
                } catch (err) {
                    console.error('Failed to register pengurus user:', err);
                    setPengurusStatus('pending');
                }
            }
        });

        return () => unsub();
    }, [user, userRole, isAdmin]);

    // Listen for pending user count (admin only)
    useEffect(() => {
        if (!isAdmin) return;
        const q = query(collection(db, 'pengurusUsers'));
        const unsub = onSnapshot(q, (snap) => {
            const count = snap.docs.filter(d => d.data().status === 'pending').length;
            setPendingCount(count);
        });
        return () => unsub();
    }, [isAdmin]);

    // Determine Firestore collection names based on role
    const txCollection = useMemo(() => {
        if (userRole === 'putri') return 'putriTransactions';
        return 'globalTransactions'; // putra uses global
    }, [userRole]);

    const cashMatchCollectionName = useMemo(() => {
        if (userRole === 'putri') return 'putriCashMatches';
        return 'globalCashMatches';
    }, [userRole]);

    const debtCollectionName = useMemo(() => {
        if (userRole === 'putri') return 'putriDebts';
        return 'globalDebts';
    }, [userRole]);

    // Kategori per wallet
    const [pribadiCategories, setPribadiCategories] = useState(defaultCategories);
    const [pribadiIncomeCategories, setPribadiIncomeCategories] = useState(defaultIncomeCategories);
    const [asramaCategories, setAsramaCategories] = useState(defaultAsramaCategories);
    const [asramaIncomeCategories, setAsramaIncomeCategories] = useState(defaultAsramaIncomeCategories);
    const [putriCategories, setPutriCategories] = useState(defaultPutriCategories);
    const [putriIncomeCategories, setPutriIncomeCategories] = useState(defaultPutriIncomeCategories);

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
        if (!user || userRole === 'pengurus') return;
        const q = query(collection(db, txCollection), orderBy('date', 'desc'));
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
        const qMatch = query(collection(db, cashMatchCollectionName));
        const unsubscribeMatch = onSnapshot(qMatch, (snapshot) => {
            const matchData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            matchData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setCashMatches(matchData);
        });

        // Ambil data utang/piutang
        const qDebt = query(collection(db, debtCollectionName));
        const unsubscribeDebt = onSnapshot(qDebt, (snapshot) => {
            const debtData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            debtData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setDebts(debtData);
        });

        return () => {
            unsubscribe();
            unsubscribeMatch();
            unsubscribeDebt();
        };
    }, [user, userRole, txCollection, cashMatchCollectionName, debtCollectionName]);

    const handleLogoClick = (e) => {
        if (location.pathname === '/settings' && isSettingsDirty) {
            e.preventDefault();
            setUnsavedNav('/');
        }
    };

    // Firestore listeners for all category documents
    useEffect(() => {
        if (!user || userRole === 'pengurus') {
            setLoadingSettings(false);
            return;
        }

        const unsubs = [];

        if (userRole === 'putri') {
            // Putri only needs putri categories
            let loaded = { pe: false, pi: false };
            const checkAllLoaded = () => {
                if (loaded.pe && loaded.pi) setLoadingSettings(false);
            };
            unsubs.push(onSnapshot(doc(db, 'putriSettings', 'categories'), (snap) => {
                setPutriCategories(snap.exists() ? snap.data() : defaultPutriCategories);
                if (!loaded.pe) { loaded.pe = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'putriSettings', 'incomeCategories'), (snap) => {
                setPutriIncomeCategories(snap.exists() ? snap.data() : defaultPutriIncomeCategories);
                if (!loaded.pi) { loaded.pi = true; checkAllLoaded(); }
            }));
        } else {
            // Putra needs pribadi + asrama categories
            let loaded = { pe: false, pi: false, ae: false, ai: false };
            const checkAllLoaded = () => {
                if (loaded.pe && loaded.pi && loaded.ae && loaded.ai) setLoadingSettings(false);
            };
            unsubs.push(onSnapshot(doc(db, 'globalSettings', 'categories'), (snap) => {
                setPribadiCategories(snap.exists() ? snap.data() : defaultCategories);
                if (!loaded.pe) { loaded.pe = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'globalSettings', 'incomeCategories'), (snap) => {
                setPribadiIncomeCategories(snap.exists() ? snap.data() : defaultIncomeCategories);
                if (!loaded.pi) { loaded.pi = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaCategories'), (snap) => {
                setAsramaCategories(snap.exists() ? snap.data() : defaultAsramaCategories);
                if (!loaded.ae) { loaded.ae = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaIncomeCategories'), (snap) => {
                setAsramaIncomeCategories(snap.exists() ? snap.data() : defaultAsramaIncomeCategories);
                if (!loaded.ai) { loaded.ai = true; checkAllLoaded(); }
            }));
        }

        return () => unsubs.forEach(u => u());
    }, [user, userRole]);

    // PWA Install Prompt Listener
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        });
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') setShowInstallBanner(false);
            setDeferredPrompt(null);
        });
    };

    // Filter transaksi berdasarkan wallet aktif & hitung totals
    const { filteredTransactions, totalBalance, totalIncome, totalExpense, totalTransfer } = useMemo(() => {
        let filtered = transactions;

        // For Putri, all transactions are "putri" wallet. For putra, filter by activeWallet.
        if (userRole === 'putri') {
            // No wallet filter needed, all putri transactions belong to putri
        } else {
            if (activeWallet !== 'all') {
                filtered = transactions.filter(t => {
                    if (t.type === 'transfer') {
                        return t.fromWallet === activeWallet || t.toWallet === activeWallet;
                    }
                    return t.wallet === activeWallet;
                });
            }
        }

        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(t => {
                const txDate = new Date(t.date);
                if (dateFilter === 'today') return txDate.toDateString() === now.toDateString();
                if (dateFilter === 'week') return Math.abs(now - txDate) / 86400000 <= 7;
                if (dateFilter === 'month') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
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

        let income = 0, expense = 0, transfer = 0;
        filtered.forEach(t => {
            if (t.type === 'transfer') {
                transfer += t.amount;
                if (activeWallet === 'all') { /* transfer doesn't affect total */ }
                else if (t.fromWallet === activeWallet) expense += t.amount;
                else if (t.toWallet === activeWallet) income += t.amount;
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
    }, [transactions, activeWallet, dateFilter, searchQuery, userRole]);

    // Tambah transaksi baru
    const addTransaction = async (newTransaction) => {
        try {
            const { id, ...transactionData } = newTransaction;
            transactionData.createdAt = Date.now();
            // For putri role, force wallet to 'putri'
            if (userRole === 'putri') {
                transactionData.wallet = 'putri';
            }
            await addDoc(collection(db, txCollection), transactionData);
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal menyimpan transaksi: ' + error.message });
        }
    };

    // Tambah log pencocokan kas
    const addCashMatchLog = async (newMatch) => {
        try {
            const { id, ...matchData } = newMatch;
            await addDoc(collection(db, cashMatchCollectionName), matchData);
            setToast({ isOpen: true, message: 'Pengecekan saldo telah dicatat!' });
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal menyimpan riwayat cek saldo: ' + error.message });
        }
    };

    // Update transaksi
    const updateTransaction = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, txCollection, id), updatedData);
            setEditingTransaction(null);
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal mengupdate transaksi: ' + error.message });
        }
    };

    // Hapus transaksi
    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, txCollection, id));
        } catch (error) {
            setAlertModal({ isOpen: true, message: 'Gagal menghapus transaksi: ' + error.message });
        }
    };

    const saveCategoriesForWallet = async (walletId, tabType, updatedCategories) => {
        // Determine the correct settings collection and doc name
        let settingsCollection, docName;

        if (userRole === 'putri') {
            settingsCollection = 'putriSettings';
            docName = tabType === 'income' ? 'incomeCategories' : 'categories';
        } else {
            settingsCollection = 'globalSettings';
            const docMap = {
                'pribadi-expense': 'categories',
                'pribadi-income': 'incomeCategories',
                'asrama-expense': 'asramaCategories',
                'asrama-income': 'asramaIncomeCategories',
            };
            docName = docMap[`${walletId}-${tabType}`];
        }

        if (!docName) return;
        try {
            await setDoc(doc(db, settingsCollection, docName), updatedCategories);
            setToast({ isOpen: true, message: 'Kategori berhasil disimpan!' });
            setIsSettingsDirty(false);
            setTimeout(() => navigate('/'), 1000);
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
        if (walletId === 'putri') {
            return type === 'income' ? putriIncomeCategories : putriCategories;
        }
        if (walletId === 'asrama') {
            return type === 'income' ? asramaIncomeCategories : asramaCategories;
        }
        return type === 'income' ? pribadiIncomeCategories : pribadiCategories;
    };

    // Dynamic styles
    const pageStyle = {
        backgroundImage: `radial-gradient(${theme.dotColor} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundColor: theme.bgPageColor
    };

    // 1. Loading auth
    if (loadingAuth) {
        return (
            <div className={`min-h-screen ${theme.bgPage} flex flex-col items-center justify-center font-sans p-6`} style={pageStyle}>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-10 animate-bounce">
                    <div className={`absolute inset-0 bg-indigo-400 border-4 border-black pop-shadow-sm transform rotate-[15deg]`}></div>
                    <div className="absolute inset-0 bg-white border-4 border-black pop-shadow flex items-center justify-center transform -rotate-[5deg]">
                        <Wallet size={40} className="text-black animate-pulse" strokeWidth={3} />
                    </div>
                </div>
                <div className="bg-white border-4 border-black pop-shadow px-4 sm:px-6 py-2 sm:py-3 transform rotate-[-2deg]">
                    <h1 className="text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tighter text-center animate-pulse whitespace-nowrap">
                        {theme.loadingText}
                    </h1>
                </div>
            </div>
        );
    }

    // 2. No user → Login
    if (!user) {
        return <Login />;
    }

    // 3. Loading settings
    if (loadingSettings) {
        return (
            <div className={`min-h-screen ${theme.bgPage} flex flex-col items-center justify-center font-sans p-6`} style={pageStyle}>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-10 animate-bounce" style={{ animationDelay: '0.1s' }}>
                    <div className={`absolute inset-0 ${theme.accentPrimary} border-4 border-black pop-shadow-sm transform rotate-[15deg]`}></div>
                    <div className="absolute inset-0 bg-white border-4 border-black pop-shadow flex items-center justify-center transform -rotate-[5deg]">
                        <DollarSign size={40} className="text-black animate-pulse" strokeWidth={3} />
                    </div>
                </div>
                <div className="bg-white border-4 border-black pop-shadow px-4 sm:px-6 py-2 sm:py-3 transform rotate-[2deg]">
                    <h1 className="text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tighter text-center animate-pulse whitespace-nowrap">
                        {theme.loadingText2}
                    </h1>
                </div>
            </div>
        );
    }

    // === PENGURUS VIEW ===
    if (userRole === 'pengurus') {
        // Pengurus status check (loading / pending / blocked)
        if (!isAdmin && pengurusStatus !== 'approved') {
            return (
                <div className={`min-h-screen ${theme.bgPage} font-sans flex items-center justify-center p-6`} style={pageStyle}>
                    <div className="max-w-md w-full bg-white border-4 border-black p-8 pop-shadow-sm flex flex-col items-center text-center">
                        {pengurusStatus === 'loading' && (
                            <>
                                <div className="bg-emerald-500 p-4 border-4 border-black mb-6 animate-pulse">
                                    <Shield size={48} strokeWidth={3} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Memverifikasi...</h2>
                                <p className="text-sm text-slate-500 font-bold">Memeriksa status akun Anda.</p>
                            </>
                        )}
                        {pengurusStatus === 'pending' && (
                            <>
                                <div className="bg-amber-400 p-4 border-4 border-black mb-6 rotate-[-3deg]">
                                    <Clock size={48} strokeWidth={3} className="text-black" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Menunggu Persetujuan</h2>
                                <p className="text-sm text-slate-500 font-bold mb-6">Permintaan akses Anda sedang ditinjau oleh admin. Silakan tunggu persetujuan.</p>
                                <div className="bg-amber-50 border-2 border-amber-300 p-3 w-full mb-6">
                                    <p className="text-xs text-amber-700 font-bold">📧 {user.email}</p>
                                </div>
                                <button onClick={handleLogout} className="bg-black text-white font-black uppercase tracking-widest text-sm py-3 px-6 border-4 border-black hover:bg-red-500 transition-colors pop-shadow-sm">
                                    Keluar
                                </button>
                            </>
                        )}
                        {pengurusStatus === 'blocked' && (
                            <>
                                <div className="bg-red-500 p-4 border-4 border-black mb-6 rotate-[3deg]">
                                    <Ban size={48} strokeWidth={3} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-red-500">Akun Diblokir</h2>
                                <p className="text-sm text-slate-500 font-bold mb-6">Maaf, akun Anda telah diblokir oleh admin dan tidak dapat mengakses Dashboard Pengurus.</p>
                                <div className="bg-red-50 border-2 border-red-300 p-3 w-full mb-6">
                                    <p className="text-xs text-red-700 font-bold">📧 {user.email}</p>
                                </div>
                                <button onClick={handleLogout} className="bg-black text-white font-black uppercase tracking-widest text-sm py-3 px-6 border-4 border-black hover:bg-red-500 transition-colors pop-shadow-sm">
                                    Keluar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className={`min-h-screen ${theme.bgPage} font-sans selection:bg-black selection:text-emerald-400 pb-20`}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&display=swap');
                    body {
                        font-family: 'Archivo', sans-serif;
                        background-image: radial-gradient(${theme.dotColor} 1px, transparent 1px);
                        background-size: 20px 20px;
                        background-color: ${theme.bgPageColor};
                    }
                    .pop-shadow { box-shadow: 8px 8px 0px 0px rgba(0,0,0,1); transition: all 0.2s ease-in-out; }
                    .pop-shadow:hover { box-shadow: 12px 12px 0px 0px rgba(0,0,0,1); transform: translate(-4px, -4px); }
                    .pop-shadow-sm { box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); }
                    .animate-marquee { animation: marquee 15s linear infinite; }
                    .animate-marquee2 { animation: marquee2 15s linear infinite; }
                    @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
                    @keyframes marquee2 { 0% { transform: translateX(100%); } 100% { transform: translateX(0%); } }
                `}} />

                <Header
                    onLogout={handleLogout}
                    userEmail={user.email}
                    onOpenSettings={() => { }}
                    onLogoClick={() => { }}
                    onOpenCalculator={() => { }}
                    onOpenCashMatch={() => { }}
                    onOpenComparison={() => { }}
                    onOpenDebt={() => { }}
                    isPengurus={true}
                    theme={theme}
                    onOpenAccountManager={isAdmin ? () => setShowAccountManager(true) : null}
                    onOpenPengurusComparison={() => setShowPengurusComparison(true)}
                    pendingCount={isAdmin ? pendingCount : 0}
                />

                <Marquee text={theme.marqueeText} bg={theme.marqueeBg} textCol="text-white" />

                <PengurusDashboard 
                    isAdmin={isAdmin} 
                    showComparison={showPengurusComparison} 
                    onCloseComparison={() => setShowPengurusComparison(false)} 
                />

                {/* Account Manager Modal */}
                {showAccountManager && (
                    <PengurusAccountManager onClose={() => setShowAccountManager(false)} />
                )}
            </div>
        );
    }

    // === PUTRI / PUTRA VIEW ===
    // Determine which wallets to show
    const availableWallets = roleConfig?.wallets || ['pribadi', 'asrama'];
    const showWalletSwitcher = availableWallets.length > 1;

    // For putri, force wallet context
    const effectiveWallet = userRole === 'putri' ? 'putri' : activeWallet;

    return (
        <div className={`min-h-screen ${theme.bgPage} font-sans selection:bg-black ${theme.accentText === 'text-yellow-400' ? 'selection:text-yellow-400' : 'selection:text-rose-400'} pb-20`}>
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&display=swap');
        
        body {
          font-family: 'Archivo', sans-serif;
          background-image: radial-gradient(${theme.dotColor} 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: ${theme.bgPageColor};
        }
        
        .border-text { -webkit-text-stroke: 2px currentColor; }
        .animate-marquee { animation: marquee 15s linear infinite; }
        .animate-marquee2 { animation: marquee2 15s linear infinite; }
        
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
        @keyframes marquee2 { 0% { transform: translateX(100%); } 100% { transform: translateX(0%); } }
        
        .pop-shadow { box-shadow: 8px 8px 0px 0px rgba(0,0,0,1); transition: all 0.2s ease-in-out; }
        .pop-shadow:hover { box-shadow: 12px 12px 0px 0px rgba(0,0,0,1); transform: translate(-4px, -4px); }
        .pop-shadow-sm { box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); }
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
                onOpenComparison={() => setShowComparison(true)}
                onOpenDebt={() => setShowDebtModal(true)}
                theme={theme}
            />

            <Marquee text={theme.marqueeText} bg={theme.marqueeBg} textCol={userRole === 'putri' ? 'text-white' : 'text-black'} />

            <div className="pb-20">
                <Routes>
                    <Route path="/settings" element={
                        <main className="container mx-auto px-6 mt-12">
                            <Settings
                                pribadiCategories={userRole === 'putri' ? putriCategories : pribadiCategories}
                                pribadiIncomeCategories={userRole === 'putri' ? putriIncomeCategories : pribadiIncomeCategories}
                                asramaCategories={userRole === 'putri' ? putriCategories : asramaCategories}
                                asramaIncomeCategories={userRole === 'putri' ? putriIncomeCategories : asramaIncomeCategories}
                                onSaveCategories={saveCategoriesForWallet}
                                onBack={(path = '/') => {
                                    if (isSettingsDirty) {
                                        setUnsavedNav(path);
                                    } else {
                                        navigate(path);
                                    }
                                }}
                                setDirty={setIsSettingsDirty}
                                availableWallets={availableWallets}
                            />
                        </main>
                    } />

                    <Route path="/" element={
                        <>
                            {/* Wallet Switcher - Only for Putra */}
                            {showWalletSwitcher && (
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
                            )}

                            {/* Putri: Single wallet header */}
                            {userRole === 'putri' && (
                                <div className="bg-rose-400 border-b-4 border-black">
                                    <div className="container mx-auto px-6 py-3 flex items-center justify-center gap-3">
                                        <Home size={20} strokeWidth={3} className="text-white" />
                                        <span className="font-black uppercase tracking-widest text-sm text-white">💜 Asrama Putri 💜</span>
                                    </div>
                                </div>
                            )}

                            <main className="container mx-auto px-6 mt-12">
                                <BalanceCards
                                    totalBalance={totalBalance}
                                    totalIncome={totalIncome}
                                    totalExpense={totalExpense}
                                    totalTransfer={totalTransfer}
                                    activeWallet={effectiveWallet}
                                    onToggleSummary={(type) => setActiveSummary(prev => prev === type ? null : type)}
                                    activeSummary={activeSummary}
                                />

                                {activeSummary && (
                                    <CategorySummary
                                        transactions={filteredTransactions}
                                        type={activeSummary}
                                        onClose={() => setActiveSummary(null)}
                                        getCategoriesForWallet={getCategoriesForWallet}
                                        activeWallet={effectiveWallet}
                                    />
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <section>
                                        <TransactionForm
                                            onAddTransaction={addTransaction}
                                            onUpdateTransaction={updateTransaction}
                                            getCategoriesForWallet={getCategoriesForWallet}
                                            activeWallet={effectiveWallet}
                                            editingTransaction={editingTransaction}
                                            setEditingTransaction={setEditingTransaction}
                                            availableWallets={availableWallets}
                                        />
                                    </section>

                                    <section>
                                        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 mt-2 xl:mt-0">
                                            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter bg-white inline-block px-4 py-2 border-4 border-black pop-shadow-sm rotate-[-2deg]">
                                                {theme.sectionTitle}
                                            </h2>

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
                                            activeWallet={effectiveWallet}
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

            {/* PWA Install Banner */}
            {showInstallBanner && (
                <div className={`fixed bottom-0 left-0 right-0 ${theme.accentPrimary} border-t-8 border-black p-4 z-50 flex items-center justify-between shadow-[0_-4px_0_0_rgba(0,0,0,1)]`}>
                    <div className="flex-1">
                        <h3 className="font-black uppercase text-xl text-black">INSTALL CUANTRACKER.</h3>
                        <p className="font-bold text-black text-sm pr-4 limit-2-lines">Akses lebih cepat & tanpa url bar! Tambahkan ke layar utama.</p>
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

            <MonthlyComparison
                isOpen={showComparison}
                onClose={() => setShowComparison(false)}
                transactions={transactions}
                getCategoriesForWallet={getCategoriesForWallet}
                activeWallet={effectiveWallet}
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
                message="Ada editan kategori yang belum disimpan. Yakin mau pindah? (Editan bakal hangus!)"
                cancelText="KEMBALI KE EDITOR"
                confirmText="YAKIN, HANGUSKAN"
                onCancel={() => setUnsavedNav(null)}
                onConfirm={() => {
                    setIsSettingsDirty(false);
                    navigate(unsavedNav);
                    setUnsavedNav(null);
                }}
            />

            <DebtModal
                isOpen={showDebtModal}
                onClose={() => setShowDebtModal(false)}
                debts={debts}
                addTransaction={addTransaction}
            />
        </div>
    );
}
