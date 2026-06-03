import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, Wallet, Home, Download, Shield, Clock, Ban, Mail, User, LogOut, Users, ChevronRight } from 'lucide-react';
import Marquee from './components/Marquee';
import Header from './components/Header';
import BalanceCards from './components/BalanceCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Login from './components/Login';
import Settings from './components/Settings';
import SettingsPage from './components/SettingsPage';
import CategorySummary from './components/CategorySummary';
import AlertModal from './components/AlertModal';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import Calculator from './components/Calculator';
import CashMatchModal from './components/CashMatchModal';
import MonthlyComparison from './components/MonthlyComparison';
import DebtModal from './components/DebtModal';
import BottomNav from './components/BottomNav';
import PengurusDashboard from './components/PengurusDashboard';
import PengurusAccountManager from './components/PengurusAccountManager';
import PengurusMonthlyComparison from './components/PengurusMonthlyComparison';
import AiAssistant from './components/AiAssistant';
import QuickInput from './components/QuickInput';
import {
    defaultCategories, defaultIncomeCategories,
    defaultAsramaCategories, defaultAsramaIncomeCategories,
    defaultPutriCategories, defaultPutriIncomeCategories,
    defaultLogistikCategories, defaultLogistikIncomeCategories,
    WALLETS, ROLE_CONFIG, getRoleFromEmail, getRolesFromEmail, ADMIN_EMAIL
} from './constants';
import { auth, db, collection, addDoc, deleteDoc, doc, setDoc, updateDoc, onSnapshot, query, orderBy, getDoc, serverTimestamp, signOut } from './firebase';
import { getInitialUiSkin, subscribeUiSkin } from './theme';

export default function App() {
    const [user, setUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null); // For multi-role users
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
    const [uiSkin, setUiSkin] = useState(getInitialUiSkin);

    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [showQuickInput, setShowQuickInput] = useState(false);
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
    const availableRoles = useMemo(() => getRolesFromEmail(user?.email), [user?.email]);
    const needsRolePicker = availableRoles.length > 1 && !selectedRole;
    const userRole = useMemo(() => getRoleFromEmail(user?.email, selectedRole), [user?.email, selectedRole]);
    const roleConfig = useMemo(() => userRole ? ROLE_CONFIG[userRole] : null, [userRole]);
    const theme = roleConfig?.theme || ROLE_CONFIG.putra.theme;
    const isAdmin = user?.email === ADMIN_EMAIL;

    // Tint the phone status bar to match the (always-colored) header per role,
    // in both light and dark mode, so there's no seam above the header.
    useEffect(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta && theme?.statusBarColor) meta.setAttribute('content', theme.statusBarColor);
    }, [theme?.statusBarColor]);

    useEffect(() => subscribeUiSkin(setUiSkin), []);

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
        if (userRole === 'logistik') return 'logistikTransactions';
        return 'globalTransactions'; // putra uses global
    }, [userRole]);

    const cashMatchCollectionName = useMemo(() => {
        if (userRole === 'putri') return 'putriCashMatches';
        if (userRole === 'logistik') return 'logistikCashMatches';
        return 'globalCashMatches';
    }, [userRole]);

    const debtCollectionName = useMemo(() => {
        if (userRole === 'putri') return 'putriDebts';
        if (userRole === 'logistik') return 'logistikDebts';
        return 'globalDebts';
    }, [userRole]);

    // Kategori per wallet
    const [pribadiCategories, setPribadiCategories] = useState(defaultCategories);
    const [pribadiIncomeCategories, setPribadiIncomeCategories] = useState(defaultIncomeCategories);
    const [asramaCategories, setAsramaCategories] = useState(defaultAsramaCategories);
    const [asramaIncomeCategories, setAsramaIncomeCategories] = useState(defaultAsramaIncomeCategories);
    const [putriCategories, setPutriCategories] = useState(defaultPutriCategories);
    const [putriIncomeCategories, setPutriIncomeCategories] = useState(defaultPutriIncomeCategories);
    const [logistikCategories, setLogistikCategories] = useState(defaultLogistikCategories);
    const [logistikIncomeCategories, setLogistikIncomeCategories] = useState(defaultLogistikIncomeCategories);

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
        if (location.pathname === '/kategori' && isSettingsDirty) {
            e.preventDefault();
            setUnsavedNav('/');
        }
    };

    // Firestore listeners for all category documents
    useEffect(() => {
        if (!user) {
            setLoadingSettings(false);
            return;
        }

        const unsubs = [];

        if (userRole === 'pengurus') {
            // Pengurus needs asrama, putri, and logistik categories
            let loaded = { pe: false, pi: false, ae: false, ai: false, le: false, li: false };
            const checkAllLoaded = () => {
                if (loaded.pe && loaded.pi && loaded.ae && loaded.ai && loaded.le && loaded.li) setLoadingSettings(false);
            };
            unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaCategories'), (snap) => {
                setAsramaCategories(snap.exists() ? snap.data() : defaultAsramaCategories);
                if (!loaded.ae) { loaded.ae = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'globalSettings', 'asramaIncomeCategories'), (snap) => {
                setAsramaIncomeCategories(snap.exists() ? snap.data() : defaultAsramaIncomeCategories);
                if (!loaded.ai) { loaded.ai = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'putriSettings', 'categories'), (snap) => {
                setPutriCategories(snap.exists() ? snap.data() : defaultPutriCategories);
                if (!loaded.pe) { loaded.pe = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'putriSettings', 'incomeCategories'), (snap) => {
                setPutriIncomeCategories(snap.exists() ? snap.data() : defaultPutriIncomeCategories);
                if (!loaded.pi) { loaded.pi = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'logistikSettings', 'categories'), (snap) => {
                setLogistikCategories(snap.exists() ? snap.data() : defaultLogistikCategories);
                if (!loaded.le) { loaded.le = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'logistikSettings', 'incomeCategories'), (snap) => {
                setLogistikIncomeCategories(snap.exists() ? snap.data() : defaultLogistikIncomeCategories);
                if (!loaded.li) { loaded.li = true; checkAllLoaded(); }
            }));
        } else if (userRole === 'putri') {
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
        } else if (userRole === 'logistik') {
            // Logistik only needs logistik categories
            let loaded = { le: false, li: false };
            const checkAllLoaded = () => {
                if (loaded.le && loaded.li) setLoadingSettings(false);
            };
            unsubs.push(onSnapshot(doc(db, 'logistikSettings', 'categories'), (snap) => {
                setLogistikCategories(snap.exists() ? snap.data() : defaultLogistikCategories);
                if (!loaded.le) { loaded.le = true; checkAllLoaded(); }
            }));
            unsubs.push(onSnapshot(doc(db, 'logistikSettings', 'incomeCategories'), (snap) => {
                setLogistikIncomeCategories(snap.exists() ? snap.data() : defaultLogistikIncomeCategories);
                if (!loaded.li) { loaded.li = true; checkAllLoaded(); }
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
        if (userRole === 'putri' || userRole === 'logistik') {
            // No wallet filter needed, single-wallet roles
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
        } else if (userRole === 'logistik') {
            settingsCollection = 'logistikSettings';
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
        if (walletId === 'logistik') {
            return type === 'income' ? logistikIncomeCategories : logistikCategories;
        }
        return type === 'income' ? pribadiIncomeCategories : pribadiCategories;
    };

    // Dynamic styles. Loading screens render before the main view's <style> tag,
    // so they set the page background inline — make that dark-aware too.
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const isSoftSkin = uiSkin === 'soft';
    const pageStyle = {
        backgroundImage: isSoftSkin
            ? 'radial-gradient(rgba(36,59,53,0.11) 1px, transparent 1px)'
            : `radial-gradient(${isDark ? 'rgba(255,255,255,0.05)' : theme.dotColor} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundColor: isSoftSkin ? '#fffaf0' : isDark ? '#14141b' : theme.bgPageColor
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

    // 2.5. Multi-role picker
    if (needsRolePicker) {
        return (
            <div className={`min-h-screen bg-slate-100 flex flex-col items-center justify-center font-sans p-6`} style={{
                backgroundImage: `radial-gradient(#64748b 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            }}>
                <div className="max-w-md w-full bg-white border-4 border-black p-8 pop-shadow flex flex-col items-center text-center">
                    <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Pilih Akses</h1>
                    <p className="text-sm font-bold text-gray-500 mb-8 uppercase tracking-wider">Akun Anda memiliki akses ganda</p>
                    
                    <div className="w-full space-y-4">
                        {availableRoles.map(r => {
                            const config = ROLE_CONFIG[r];
                            if (!config) return null;
                            return (
                                <button 
                                    key={r}
                                    onClick={() => setSelectedRole(r)}
                                    className={`w-full ${config.theme?.bgPage || 'bg-white'} border-4 border-black p-4 pop-shadow-sm hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider flex items-center justify-between`}
                                >
                                    <span>{config.label || r}</span>
                                    <span className="opacity-50 text-xs">(Pilih)</span>
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        onClick={() => signOut(auth)}
                        className="mt-8 text-sm font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider underline decoration-2 underline-offset-4"
                    >
                        Batal & Logout
                    </button>
                </div>
            </div>
        );
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
                    userPhoto={user.photoURL}
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

                <Routes>
                    <Route path="/laporan" element={
                        <main className="container mx-auto px-4 sm:px-6 mt-6 mb-28 max-w-4xl">
                            <PengurusMonthlyComparison
                                getCategoriesForWallet={getCategoriesForWallet}
                                onClose={() => navigate('/')}
                                isFullPage={true}
                            />
                        </main>
                    } />
                    <Route path="/akun" element={
                        <main className="container mx-auto px-4 sm:px-6 mt-8 mb-28 max-w-lg">
                            {/* Profile Card */}
                            <div className="bg-white border-4 border-black pop-shadow-sm p-5 mb-8">
                                <div className="flex items-center gap-4">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="Profile"
                                            className="w-16 h-16 border-4 border-black object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-emerald-400 border-4 border-black flex items-center justify-center">
                                            <User size={32} strokeWidth={2.5} className="text-black" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        {user.displayName && (
                                            <h2 className="font-black text-lg uppercase tracking-tight truncate">{user.displayName}</h2>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Mail size={14} strokeWidth={2.5} className="text-gray-400 shrink-0" />
                                            <span className="text-sm font-bold text-gray-500 truncate">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role Badge */}
                            <div className="bg-emerald-50 border-3 border-emerald-400 p-4 mb-6 flex items-center gap-3">
                                <div className="bg-emerald-400 p-2 border-3 border-black">
                                    <Shield size={20} strokeWidth={2.5} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase tracking-tight text-sm text-emerald-700">
                                        {isAdmin ? 'Admin Pengurus' : 'Pengurus'}
                                    </h4>
                                    <p className="text-xs text-emerald-600 font-bold">Akses dashboard keuangan asrama</p>
                                </div>
                            </div>

                            {/* Admin: Account Manager Button */}
                            {isAdmin && (
                                <button
                                    onClick={() => setShowAccountManager(true)}
                                    className="w-full flex items-center gap-4 bg-white border-3 border-black p-4 pop-shadow-sm active:translate-y-1 active:shadow-none transition-all text-left group mb-4"
                                >
                                    <div className="bg-emerald-400 p-3 border-3 border-black shrink-0 group-active:rotate-12 transition-transform">
                                        <Users size={22} strokeWidth={2.5} className="text-black" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black uppercase tracking-tight text-sm">Kelola Akun</h4>
                                        <p className="text-xs text-gray-400 font-bold truncate">Setujui atau blokir akun pengurus</p>
                                    </div>
                                    <ChevronRight size={20} strokeWidth={2.5} className="text-gray-300 shrink-0 group-hover:translate-x-1 transition-transform" />
                                    {pendingCount > 0 && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 border-2 border-black animate-bounce">
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-3 bg-white border-3 border-black p-4 pop-shadow-sm active:translate-y-1 active:shadow-none transition-all hover:bg-red-500 hover:text-white group mt-4"
                            >
                                <div className="bg-red-400 p-2.5 border-3 border-black group-hover:bg-white transition-colors">
                                    <LogOut size={20} strokeWidth={2.5} className="text-white group-hover:text-red-500 transition-colors" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-sm">Keluar</span>
                            </button>
                        </main>
                    } />
                    <Route path="*" element={
                        <PengurusDashboard 
                            isAdmin={isAdmin} 
                            showComparison={showPengurusComparison} 
                            onCloseComparison={() => setShowPengurusComparison(false)} 
                            getCategoriesForWallet={getCategoriesForWallet}
                        />
                    } />
                </Routes>

                {/* Account Manager Modal */}
                {showAccountManager && (
                    <PengurusAccountManager onClose={() => setShowAccountManager(false)} />
                )}

                {/* Bottom Nav for Mobile */}
                <BottomNav
                    isPengurus={true}
                    theme={theme}
                />
            </div>
        );
    }

    // === PUTRI / PUTRA VIEW ===
    // Determine which wallets to show
    const availableWallets = roleConfig?.wallets || ['pribadi', 'asrama'];
    const showWalletSwitcher = availableWallets.length > 1;

    // For putri, force wallet context
    const effectiveWallet = userRole === 'putri' ? 'putri' : userRole === 'logistik' ? 'logistik' : activeWallet;

    return (
        <div className={`min-h-screen ${theme.bgPage} font-sans selection:bg-black ${theme.accentText === 'text-yellow-400' ? 'selection:text-yellow-400' : 'selection:text-rose-400'} pb-20`}>
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&display=swap');
        
        body {
          font-family: ${isSoftSkin ? "'Nunito', sans-serif" : "'Archivo', sans-serif"};
          background-image: radial-gradient(${isSoftSkin ? 'rgba(36,59,53,0.11)' : theme.dotColor} 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: ${isSoftSkin ? '#fffaf0' : theme.bgPageColor};
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
                userPhoto={user.photoURL}
                onOpenSettings={() => {
                    if (location.pathname !== '/kategori') navigate('/kategori');
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
                    <Route path="/kategori" element={
                        <main className="container mx-auto px-6 mt-12">
                            <Settings
                                pribadiCategories={userRole === 'putri' ? putriCategories : userRole === 'logistik' ? logistikCategories : pribadiCategories}
                                pribadiIncomeCategories={userRole === 'putri' ? putriIncomeCategories : userRole === 'logistik' ? logistikIncomeCategories : pribadiIncomeCategories}
                                asramaCategories={userRole === 'putri' ? putriCategories : userRole === 'logistik' ? logistikCategories : asramaCategories}
                                asramaIncomeCategories={userRole === 'putri' ? putriIncomeCategories : userRole === 'logistik' ? logistikIncomeCategories : asramaIncomeCategories}
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

                    <Route path="/setting" element={
                        <SettingsPage
                            userEmail={user.email}
                            userPhoto={user.photoURL}
                            userName={user.displayName}
                            theme={theme}
                            onOpenCashMatch={() => setShowCashMatch(true)}
                            onOpenComparison={() => setShowComparison(true)}
                            onOpenDebt={() => setShowDebtModal(true)}
                            onOpenCalculator={() => setShowCalculator(true)}
                            onOpenKategori={() => navigate('/kategori')}
                            onLogout={handleLogout}
                        />
                    } />

                    <Route path="/" element={
                        <>
                            {/* Wallet Switcher - Only for Putra */}
                            {showWalletSwitcher && (
                                    <div className="bg-white border-b-4 border-black wallet-switcher">
                                    <div className="container mx-auto px-6 flex gap-0">
                                        <button
                                            onClick={() => setActiveWallet('all')}
                                            className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 border-r-4 border-black transition-all wallet-tab ${activeWallet === 'all' ? 'bg-black text-white is-active' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <span className={`p-1.5 border-3 ${activeWallet === 'all' ? 'border-white bg-white text-black' : 'border-gray-300 bg-white text-gray-400'}`}>
                                                <DollarSign size={18} strokeWidth={3} />
                                            </span>
                                            Semua
                                        </button>
                                        <button
                                            onClick={() => setActiveWallet('pribadi')}
                                            className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 border-r-4 border-black transition-all wallet-tab ${activeWallet === 'pribadi' ? 'bg-yellow-400 text-black pop-shadow-sm is-active' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <span className={`p-1.5 border-3 ${activeWallet === 'pribadi' ? 'border-black bg-white text-yellow-600' : 'border-gray-300 bg-white text-gray-400'}`}>
                                                <Wallet size={18} strokeWidth={3} />
                                            </span>
                                            Pribadi
                                        </button>
                                        <button
                                            onClick={() => setActiveWallet('asrama')}
                                            className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all wallet-tab ${activeWallet === 'asrama' ? 'bg-indigo-400 text-white pop-shadow-sm is-active' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
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

                            <main className="container mx-auto px-6 mt-12 dashboard-main">
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

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 dashboard-layout">
                                    <section className="entry-section">
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

                                    <section id="tx-list-section" className="scroll-mt-24 history-section">
                                        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 mt-2 xl:mt-0">
                                            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter bg-white inline-block px-4 py-2 border-4 border-black pop-shadow-sm rotate-[-2deg] section-heading">
                                                {theme.sectionTitle}
                                            </h2>

                                            {/* Filter Tanggal */}
                                            <div className="flex flex-wrap gap-2 pb-2">
                                                {['all', 'today', 'week', 'month'].map(f => (
                                                    <button
                                                        key={f}
                                                        onClick={() => setDateFilter(f)}
                                                        className={`px-3 py-2 border-2 border-black font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-transform filter-chip ${dateFilter === f ? 'bg-black text-white pop-shadow-sm translate-x-1 z-10 is-active' : 'bg-white text-gray-500 hover:bg-gray-100 hover:-translate-y-1'}`}
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
                <div className={`fixed left-3 right-3 bottom-[calc(110px+env(safe-area-inset-bottom))] md:left-0 md:right-0 md:bottom-0 ${theme.accentPrimary} border-4 md:border-x-0 md:border-b-0 md:border-t-8 border-black p-3 md:p-4 z-[60] flex items-center justify-between gap-3 shadow-[0_-4px_0_0_rgba(0,0,0,1)]`}>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black uppercase text-base md:text-xl leading-none text-black">INSTALL CUANTRACKER.</h3>
                        <p className="font-bold text-black text-xs md:text-sm pr-1 md:pr-4 limit-2-lines">Akses lebih cepat & tanpa url bar! Tambahkan ke layar utama.</p>
                    </div>
                    <button
                        onClick={handleInstallClick}
                        className="bg-black text-white font-black uppercase px-3 py-2 md:px-4 md:py-3 border-4 border-black hover:bg-white hover:text-black transition-colors pop-shadow-sm flex items-center gap-2 shrink-0 text-sm md:text-base"
                    >
                        <Download size={20} strokeWidth={3} />
                        Install
                    </button>
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="absolute -top-4 -right-2 md:right-4 bg-white border-4 border-black px-1.5 py-0.5 hover:bg-gray-100 font-bold leading-none"
                        aria-label="Tutup banner install"
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
                activeWallet={user?.email === 'ucupbaba0704@gmail.com' ? 'pribadi' : effectiveWallet}
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

            {/* Bottom Nav for Mobile */}
            <BottomNav
                isPengurus={false}
                theme={theme}
                onQuickInput={() => setShowQuickInput(true)}
                onOpenComparison={() => setShowComparison(true)}
            />

            {/* AI Assistant (floating, draggable). Putra: personal wallet only. */}
            <AiAssistant
                transactions={transactions}
                userRole={userRole}
                theme={theme}
                walletFilter={userRole === 'putra' ? 'pribadi' : null}
                scopeLabel={userRole === 'putra' ? 'Dompet Pribadi (transfer masuk dari Asrama ikut dihitung; data Asrama tidak dianalisis terpisah)' : null}
                onAddTransaction={addTransaction}
                getCategoriesForWallet={getCategoriesForWallet}
                availableWallets={availableWallets}
                defaultWallet={effectiveWallet === 'all' ? (availableWallets[0] || 'pribadi') : effectiveWallet}
            />

            {/* Quick AI input (opened from bottom nav center button) */}
            <QuickInput
                isOpen={showQuickInput}
                onClose={() => setShowQuickInput(false)}
                getCategoriesForWallet={getCategoriesForWallet}
                availableWallets={availableWallets}
                activeWallet={effectiveWallet}
                onAddTransaction={addTransaction}
                theme={theme}
                showWalletToggle={userRole === 'putra' && availableWallets.length > 1}
            />
        </div>
    );
}
