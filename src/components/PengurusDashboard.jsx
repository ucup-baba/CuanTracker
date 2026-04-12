import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, Search, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';
import { defaultAsramaCategories, defaultAsramaIncomeCategories, defaultPutriCategories, defaultPutriIncomeCategories } from '../constants';
import { CategoryIcon } from './CategoryIcon';
import CategorySummary from './CategorySummary';
import PengurusMonthlyComparison from './PengurusMonthlyComparison';

// Helper to format currency
const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export default function PengurusDashboard({ isAdmin, showComparison, onCloseComparison }) {
    const [activeTab, setActiveTab] = useState('putra'); // 'putra' | 'putri'
    const [putraTransactions, setPutraTransactions] = useState([]);
    const [putriTransactions, setPutriTransactions] = useState([]);
    const [dateFilter, setDateFilter] = useState('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTx, setExpandedTx] = useState(null);
    const [activeSummary, setActiveSummary] = useState(null);

    // Fetch Putra transactions
    useEffect(() => {
        const q = query(collection(db, 'globalTransactions'), orderBy('date', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return (b.createdAt || 0) - (a.createdAt || 0);
            });
            setPutraTransactions(data);
        });
        return () => unsub();
    }, []);

    // Fetch Putri transactions
    useEffect(() => {
        const q = query(collection(db, 'putriTransactions'), orderBy('date', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return (b.createdAt || 0) - (a.createdAt || 0);
            });
            setPutriTransactions(data);
        });
        return () => unsub();
    }, []);

    // Filter only asrama transactions for putra
    const putraAsrama = useMemo(() => putraTransactions.filter(t => {
        if (t.type === 'transfer') {
            return t.fromWallet === 'asrama' || t.toWallet === 'asrama';
        }
        return t.wallet === 'asrama';
    }), [putraTransactions]);

    const currentTransactions = activeTab === 'putra' ? putraAsrama : putriTransactions;

    const categories = activeTab === 'putra' ? defaultAsramaCategories : defaultPutriCategories;
    const incomeCategories = activeTab === 'putra' ? defaultAsramaIncomeCategories : defaultPutriIncomeCategories;

    const getCatForType = (type) => type === 'income' ? incomeCategories : categories;

    // Apply date + search filters
    const filtered = useMemo(() => {
        let data = currentTransactions;
        if (dateFilter !== 'all') {
            const now = new Date();
            data = data.filter(t => {
                const txDate = new Date(t.date);
                if (dateFilter === 'today') return txDate.toDateString() === now.toDateString();
                if (dateFilter === 'week') return Math.abs(now - txDate) / 86400000 <= 7;
                if (dateFilter === 'month') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
                return true;
            });
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            data = data.filter(t =>
                t.text?.toLowerCase().includes(q) ||
                t.category?.toLowerCase().includes(q) ||
                t.subCategory?.toLowerCase().includes(q)
            );
        }
        return data;
    }, [currentTransactions, dateFilter, searchQuery]);

    // Totals
    const totals = useMemo(() => {
        let income = 0, expense = 0;
        filtered.forEach(t => {
            if (t.type === 'transfer') {
                const currentWallet = activeTab === 'putra' ? 'asrama' : 'putri';
                if (t.fromWallet === currentWallet) expense += t.amount;
                else if (t.toWallet === currentWallet) income += t.amount;
            } else if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expense += t.amount;
        });
        return { income, expense, balance: income - expense };
    }, [filtered, activeTab]);

    // Combined totals
    const combinedTotals = useMemo(() => {
        let pIncome = 0, pExpense = 0, uIncome = 0, uExpense = 0;
        
        putraAsrama.forEach(t => {
            if (t.type === 'transfer') {
                if (t.fromWallet === 'asrama') pExpense += t.amount;
                else if (t.toWallet === 'asrama') pIncome += t.amount;
            } else if (t.type === 'income') pIncome += t.amount;
            else if (t.type === 'expense') pExpense += t.amount;
        });
        
        putriTransactions.forEach(t => {
            if (t.type === 'transfer') {
                if (t.fromWallet === 'putri') uExpense += t.amount;
                else if (t.toWallet === 'putri') uIncome += t.amount;
            } else if (t.type === 'income') uIncome += t.amount;
            else if (t.type === 'expense') uExpense += t.amount;
        });
        
        return {
            putraIncome: pIncome, putraExpense: pExpense, putraBalance: pIncome - pExpense,
            putriIncome: uIncome, putriExpense: uExpense, putriBalance: uIncome - uExpense,
            totalBalance: (pIncome - pExpense) + (uIncome - uExpense)
        };
    }, [putraAsrama, putriTransactions]);

    const tabColor = activeTab === 'putra' ? 'indigo' : 'rose';
    const tabBg = activeTab === 'putra' ? 'bg-indigo-500' : 'bg-rose-500';

    if (showComparison) {
        return (
            <PengurusMonthlyComparison
                putraTransactions={putraAsrama}
                putriTransactions={putriTransactions}
                onClose={onCloseComparison}
            />
        );
    }

    return (
        <main className="container mx-auto px-4 sm:px-6 mt-8 pb-20">
            {/* Combined Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border-4 border-slate-800 p-5 pop-shadow-sm">
                    <p className="font-black uppercase tracking-widest text-xs text-slate-500 mb-1">Total Saldo Gabungan</p>
                    <p className={`text-2xl sm:text-3xl font-black ${combinedTotals.totalBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatRp(combinedTotals.totalBalance)}
                    </p>
                </div>
                <div className="bg-white border-4 border-slate-800 p-5 pop-shadow-sm">
                    <p className="font-black uppercase tracking-widest text-xs text-indigo-500 mb-1">Saldo Asrama Putra</p>
                    <p className="text-xl sm:text-2xl font-black">{formatRp(combinedTotals.putraBalance)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        <span className="text-emerald-600">+{formatRp(combinedTotals.putraIncome)}</span> / <span className="text-red-500">-{formatRp(combinedTotals.putraExpense)}</span>
                    </p>
                </div>
                <div className="bg-white border-4 border-slate-800 p-5 pop-shadow-sm">
                    <p className="font-black uppercase tracking-widest text-xs text-rose-500 mb-1">Saldo Asrama Putri</p>
                    <p className="text-xl sm:text-2xl font-black">{formatRp(combinedTotals.putriBalance)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        <span className="text-emerald-600">+{formatRp(combinedTotals.putriIncome)}</span> / <span className="text-red-500">-{formatRp(combinedTotals.putriExpense)}</span>
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-0 mb-6">
                <button
                    onClick={() => { setActiveTab('putra'); setActiveSummary(null); }}
                    className={`flex-1 py-3 font-black uppercase tracking-widest text-sm border-4 border-slate-800 border-r-2 transition-all ${activeTab === 'putra' ? 'bg-indigo-500 text-white pop-shadow-sm' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                >
                    🏠 Asrama Putra
                </button>
                <button
                    onClick={() => { setActiveTab('putri'); setActiveSummary(null); }}
                    className={`flex-1 py-3 font-black uppercase tracking-widest text-sm border-4 border-slate-800 border-l-2 transition-all ${activeTab === 'putri' ? 'bg-rose-500 text-white pop-shadow-sm' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                >
                    🏠 Asrama Putri
                </button>
            </div>

            {/* Balance Cards for active tab */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={`${tabBg} border-4 border-slate-800 p-4 pop-shadow-sm text-white`}>
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={18} strokeWidth={3} />
                        <span className="font-black uppercase tracking-widest text-xs">Saldo</span>
                    </div>
                    <p className="text-2xl font-black">{formatRp(totals.balance)}</p>
                </div>
                <div 
                    className="bg-white border-4 border-slate-800 p-4 pop-shadow-sm cursor-pointer hover:bg-emerald-50 transition-colors"
                    onClick={() => setActiveSummary(prev => prev === 'income' ? null : 'income')}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={18} strokeWidth={3} className="text-emerald-500" />
                        <span className="font-black uppercase tracking-widest text-xs text-emerald-600">Pemasukan</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">{formatRp(totals.income)}</p>
                </div>
                <div 
                    className="bg-white border-4 border-slate-800 p-4 pop-shadow-sm cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => setActiveSummary(prev => prev === 'expense' ? null : 'expense')}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown size={18} strokeWidth={3} className="text-red-500" />
                        <span className="font-black uppercase tracking-widest text-xs text-red-500">Pengeluaran</span>
                    </div>
                    <p className="text-2xl font-black text-red-500">{formatRp(totals.expense)}</p>
                </div>
            </div>

            {/* Category Summary Dropdown */}
            {activeSummary && (
                <CategorySummary
                    transactions={filtered}
                    type={activeSummary}
                    categories={getCatForType(activeSummary)}
                    activeWallet={activeTab === 'putra' ? 'asrama' : 'putri'}
                    getCategoriesForWallet={(w, t) => getCatForType(t)}
                    onClose={() => setActiveSummary(null)}
                />
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex flex-wrap gap-2">
                    {['all', 'today', 'week', 'month'].map(f => (
                        <button
                            key={f}
                            onClick={() => setDateFilter(f)}
                            className={`px-3 py-2 border-3 border-slate-800 font-black uppercase tracking-widest text-[10px] transition-all ${dateFilter === f ? `${tabBg} text-white pop-shadow-sm` : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                        >
                            {f === 'all' ? 'Semua' : f === 'today' ? 'Hari Ini' : f === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={3} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari transaksi..."
                        className="w-full pl-9 pr-3 py-2 border-3 border-slate-800 font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                </div>
            </div>

            {/* Transaction List (Read-only) */}
            <div className="bg-white border-4 border-slate-800 pop-shadow-sm">
                <div className={`${tabBg} px-4 py-3 border-b-4 border-slate-800`}>
                    <h3 className="font-black uppercase tracking-widest text-sm text-white flex items-center gap-2">
                        <Calendar size={16} strokeWidth={3} />
                        Riwayat Transaksi — {activeTab === 'putra' ? 'Asrama Putra' : 'Asrama Putri'}
                        <span className="ml-auto bg-white text-slate-800 px-2 py-0.5 text-xs font-black">{filtered.length}</span>
                    </h3>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Belum ada transaksi</p>
                    </div>
                ) : (
                    <div className="divide-y-2 divide-slate-200 max-h-[600px] overflow-y-auto">
                        {filtered.map((t, idx) => {
                            const cats = getCatForType(t.type);
                            const catInfo = cats[t.category];
                            const isExpanded = expandedTx === t.id;

                            return (
                                <div
                                    key={t.id}
                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => setExpandedTx(isExpanded ? null : t.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 ${catInfo?.color || 'bg-gray-300'} border-2 border-slate-800 flex items-center justify-center shrink-0`}>
                                            <CategoryIcon iconName={catInfo?.icon || 'Package'} size={18} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm truncate">{t.text || t.category}</p>
                                            <p className="text-xs text-slate-500 font-bold">{t.category}{t.subCategory ? ` › ${t.subCategory}` : ''}</p>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right shrink-0">
                                            {(() => {
                                                const cw = activeTab === 'putra' ? 'asrama' : 'putri';
                                                const isValIncome = t.type === 'income' || (t.type === 'transfer' && t.toWallet === cw);
                                                const isValExpense = t.type === 'expense' || (t.type === 'transfer' && t.fromWallet === cw);
                                                const sign = isValIncome ? '+' : (isValExpense ? '-' : '');
                                                const colorClass = isValIncome ? 'text-emerald-600' : (isValExpense ? 'text-red-500' : 'text-slate-500');
                                                
                                                return (
                                                    <p className={`font-black text-sm ${colorClass}`}>
                                                        {sign}{formatRp(t.amount)}
                                                    </p>
                                                );
                                            })()}
                                            <p className="text-[10px] text-slate-400 font-bold">{t.date}</p>
                                        </div>

                                        {/* Expand Icon */}
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="mt-2 pl-13 p-3 bg-slate-50 border-2 border-slate-200 text-xs space-y-1">
                                            <p><span className="font-black">Kategori:</span> {t.category}</p>
                                            {t.subCategory && <p><span className="font-black">Sub:</span> {t.subCategory}</p>}
                                            <p><span className="font-black">Tanggal:</span> {t.date}</p>
                                            <p><span className="font-black">Jumlah:</span> {formatRp(t.amount)}</p>
                                            {t.text && <p><span className="font-black">Catatan:</span> {t.text}</p>}
                                            <p><span className="font-black">Wallet:</span> {t.wallet}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
