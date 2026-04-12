import React, { useMemo, useState, useEffect } from 'react';
import { formatRupiah } from '../utils';
import {
    X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    TrendingUp, TrendingDown, FileText, BarChart3, Calendar, Minus, Wallet,
    RefreshCcw, Save
} from 'lucide-react';
import { db, doc, onSnapshot, setDoc } from '../firebase';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MonthlyComparison = ({ isOpen, onClose, transactions, getCategoriesForWallet, activeWallet }) => {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [activeTab, setActiveTab] = useState('both'); // 'both' | 'income' | 'expense'
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedSubs, setExpandedSubs] = useState({});

    const [note, setNote] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const noteDocRef = doc(db, 'globalMonthlyNotes', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`);
        const unsubscribe = onSnapshot(noteDocRef, (snap) => {
            if (snap.exists()) {
                setNote(snap.data().text || '');
            } else {
                setNote('');
            }
        });
        return () => unsubscribe();
    }, [isOpen, selectedMonth, selectedYear]);

    // ========== Compute month data (MUST be before early return) ==========
    const monthData = useMemo(() => {
        // Hanya tampilkan transaksi wallet Pribadi
        const pribadiTxs = (transactions || []).filter(t => t.wallet === 'pribadi');

        const filterByMonth = (txs, month, year) => {
            return txs.filter(t => {
                if (t.type === 'transfer') return false;
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year;
            });
        };

        const currentMonthTxs = filterByMonth(pribadiTxs, selectedMonth, selectedYear);

        // Previous month for comparison
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        const prevMonthTxs = filterByMonth(pribadiTxs, prevMonth, prevYear);

        const calcTotals = (txs) => {
            let income = 0, expense = 0;
            txs.forEach(t => {
                if (t.type === 'income') income += t.amount;
                else if (t.type === 'expense') expense += t.amount;
            });
            return { income, expense, balance: income - expense };
        };

        const current = calcTotals(currentMonthTxs);
        const prev = calcTotals(prevMonthTxs);

        // Build category breakdown for current month
        const buildCategoryBreakdown = (txs, type) => {
            const sums = {};
            let total = 0;

            txs.forEach(t => {
                if (t.type !== type) return;
                const catLabel = t.category || 'Lain-lain';
                const subCatLabel = t.subCategory || 'Tanpa Sub';

                if (!sums[catLabel]) sums[catLabel] = { amount: 0, subCategories: {} };
                sums[catLabel].amount += t.amount;

                if (!sums[catLabel].subCategories[subCatLabel]) {
                    sums[catLabel].subCategories[subCatLabel] = { amount: 0, transactions: [] };
                }
                sums[catLabel].subCategories[subCatLabel].amount += t.amount;
                sums[catLabel].subCategories[subCatLabel].transactions.push(t);
                total += t.amount;
            });

            const arr = Object.keys(sums).map(key => {
                const subArr = Object.keys(sums[key].subCategories)
                    .map(subKey => ({
                        name: subKey,
                        amount: sums[key].subCategories[subKey].amount,
                        percent: sums[key].amount > 0
                            ? (sums[key].subCategories[subKey].amount / sums[key].amount) * 100
                            : 0,
                        transactions: sums[key].subCategories[subKey].transactions
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                    }))
                    .sort((a, b) => b.amount - a.amount);

                return {
                    category: key,
                    amount: sums[key].amount,
                    percent: total > 0 ? (sums[key].amount / total) * 100 : 0,
                    subCategories: subArr
                };
            }).sort((a, b) => b.amount - a.amount);

            return { arr, total };
        };

        const incomeBreakdown = buildCategoryBreakdown(currentMonthTxs, 'income');
        const expenseBreakdown = buildCategoryBreakdown(currentMonthTxs, 'expense');

        // Percentage change helpers
        const percentChange = (curr, prev) => {
            if (prev === 0 && curr === 0) return 0;
            if (prev === 0) return 100;
            return ((curr - prev) / prev) * 100;
        };

        return {
            current,
            prev,
            incomeBreakdown,
            expenseBreakdown,
            incomeChange: percentChange(current.income, prev.income),
            expenseChange: percentChange(current.expense, prev.expense),
            prevMonthName: MONTH_NAMES[prevMonth],
        };
    }, [transactions, selectedMonth, selectedYear]);

    // Early return AFTER all hooks
    if (!isOpen) return null;

    const goToPrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(y => y - 1);
        } else {
            setSelectedMonth(m => m - 1);
        }
        setExpandedCategories({});
        setExpandedSubs({});
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(y => y + 1);
        } else {
            setSelectedMonth(m => m + 1);
        }
        setExpandedCategories({});
        setExpandedSubs({});
    };

    const handleSaveNote = async () => {
        setIsSavingNote(true);
        try {
            const noteDocRef = doc(db, 'globalMonthlyNotes', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`);
            await setDoc(noteDocRef, {
                text: note,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving note:', error);
        }
        setIsSavingNote(false);
    };

    const toggleCategory = (key) => {
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSub = (catKey, subName) => {
        const key = `${catKey}::${subName}`;
        setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper: get catData (icon, color) for a category
    const getCatData = (catName, type) => {
        if (!getCategoriesForWallet) return null;
        const wallets = activeWallet === 'all' ? ['pribadi', 'asrama'] : [activeWallet];
        for (const w of wallets) {
            const cats = getCategoriesForWallet(w, type);
            if (cats && cats[catName]) return cats[catName];
        }
        return null;
    };

    const renderChangeIndicator = (change) => {
        if (Math.abs(change) < 0.01) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 border border-gray-300 px-2 py-0.5">
                    <Minus size={10} strokeWidth={3} /> Sama
                </span>
            );
        }
        const isUp = change > 0;
        return (
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${isUp ? 'text-green-700 bg-green-100 border-green-400' : 'text-red-700 bg-red-100 border-red-400'}`}>
                {isUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                {Math.abs(change).toFixed(1)}%
            </span>
        );
    };

    const renderCategoryList = (breakdown, type) => {
        const barClass = type === 'income' ? 'bg-green-500' : 'bg-red-500';
        const subBarClass = type === 'income' ? 'bg-green-300' : 'bg-red-300';
        const amountColor = type === 'income' ? 'text-green-600' : 'text-red-600';

        if (breakdown.arr.length === 0) {
            return (
                <div className="bg-white border-2 border-dashed border-gray-300 p-6 text-center">
                    <p className="font-bold text-gray-400 text-sm">
                        Belum ada {type === 'income' ? 'pemasukan' : 'pengeluaran'} bulan ini.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {breakdown.arr.map((item) => {
                    const catData = getCatData(item.category, type);
                    const catKey = `${type}::${item.category}`;
                    const isExpanded = expandedCategories[catKey] || false;
                    const colorClass = catData ? getCategoryColor(catData.color) : (type === 'income' ? 'bg-green-400' : 'bg-gray-400');
                    const iconName = catData?.icon || (type === 'income' ? 'TrendingUp' : 'Package');

                    return (
                        <div key={catKey} className="bg-white border-3 border-black overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(catKey)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className={`p-2 border-3 border-black ${colorClass} shrink-0`}>
                                    <CategoryIcon iconName={iconName} size={18} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-1">
                                        <span className="font-black uppercase tracking-widest text-[11px] truncate">
                                            {item.category}
                                        </span>
                                        <span className={`font-black text-sm tracking-tighter shrink-0 ${amountColor}`}>
                                            {formatRupiah(item.amount)}
                                        </span>
                                    </div>

                                    <div className="w-full bg-gray-100 border border-black h-2.5 overflow-hidden mt-1.5">
                                        <div
                                            className={`${barClass} h-full transition-all duration-500`}
                                            style={{ width: `${item.percent}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between mt-0.5">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            {item.percent.toFixed(1)}%
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400">
                                            {item.subCategories.length} sub
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-1 border-2 border-black shrink-0 transition-colors ${isExpanded ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                    {isExpanded ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                                </div>
                            </button>

                            {/* Sub-Categories */}
                            {isExpanded && (
                                <div className="border-t-3 border-black bg-gray-50">
                                    {item.subCategories.map((sub, subIndex) => {
                                        const subKey = `${catKey}::${sub.name}`;
                                        const isSubExpanded = expandedSubs[subKey] || false;

                                        return (
                                            <div
                                                key={sub.name}
                                                className={`${subIndex < item.subCategories.length - 1 ? 'border-b-2 border-dashed border-gray-300' : ''}`}
                                            >
                                                <button
                                                    onClick={() => toggleSub(catKey, sub.name)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
                                                >
                                                    <div className={`w-2.5 h-2.5 border-2 border-black ${colorClass} shrink-0`}></div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-1">
                                                            <span className="font-bold uppercase tracking-widest text-[10px] truncate text-gray-700">
                                                                {sub.name}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className="text-[9px] font-bold text-gray-400 bg-white border border-gray-300 px-1 py-0.5">
                                                                    {sub.transactions.length}x
                                                                </span>
                                                                <span className={`font-black text-xs tracking-tight ${amountColor}`}>
                                                                    {formatRupiah(sub.amount)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="w-full bg-white border border-gray-300 h-1.5 overflow-hidden mt-1 rounded-sm">
                                                            <div
                                                                className={`${subBarClass} h-full transition-all duration-500`}
                                                                style={{ width: `${sub.percent}%` }}
                                                            ></div>
                                                        </div>

                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">
                                                            {sub.percent.toFixed(1)}% dari {item.category}
                                                        </span>
                                                    </div>

                                                    <div className={`p-0.5 shrink-0 transition-colors ${isSubExpanded ? 'text-black' : 'text-gray-300'}`}>
                                                        {isSubExpanded ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                                                    </div>
                                                </button>

                                                {/* Transaction list */}
                                                {isSubExpanded && (
                                                    <div className="bg-white border-t border-gray-200 mx-4 mb-2 border-2 border-black">
                                                        {sub.transactions.map((tx, txIndex) => (
                                                            <div
                                                                key={tx.id || txIndex}
                                                                className={`flex items-center gap-2 px-3 py-2 ${txIndex < sub.transactions.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}
                                                            >
                                                                <FileText size={12} className="text-gray-400 shrink-0" strokeWidth={2.5} />
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-bold text-[11px] text-gray-800 block truncate">
                                                                        {tx.text || '-'}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                                        {tx.date}
                                                                    </span>
                                                                </div>
                                                                <span className={`font-black text-[11px] tracking-tight shrink-0 ${amountColor}`}>
                                                                    {formatRupiah(tx.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-pink-100 border-4 border-black pop-shadow w-full max-w-[480px] max-h-[90vh] flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundImage: 'radial-gradient(#00000010 1px, transparent 1px)', backgroundSize: '12px 12px' }}
            >
                {/* Header */}
                <div className="bg-black text-white px-4 py-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={20} strokeWidth={3} className="text-yellow-400" />
                        <h2 className="font-black uppercase text-base tracking-wider">Perbandingan Bulanan</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Month Navigation */}
                <div className="bg-yellow-400 border-b-4 border-black px-3 py-2 flex items-center justify-between shrink-0">
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 border-3 border-black bg-white hover:bg-gray-100 transition-colors active:scale-95"
                    >
                        <ChevronLeft size={18} strokeWidth={3} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} strokeWidth={2.5} />
                        <span className="font-black uppercase tracking-widest text-sm">
                            {MONTH_NAMES[selectedMonth]} {selectedYear}
                        </span>
                    </div>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 border-3 border-black bg-white hover:bg-gray-100 transition-colors active:scale-95"
                    >
                        <ChevronRight size={18} strokeWidth={3} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Income Card */}
                        <div className="bg-green-100 border-3 border-black p-3 pop-shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                                <TrendingUp size={14} strokeWidth={3} className="text-green-600" />
                                <span className="font-black uppercase tracking-widest text-[10px] text-green-700">Pemasukan</span>
                            </div>
                            <span className="font-black text-lg tracking-tighter text-green-600 block">
                                {formatRupiah(monthData.current.income)}
                            </span>
                            <div className="mt-1">
                                {renderChangeIndicator(monthData.incomeChange)}
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 block mt-0.5">
                                vs {monthData.prevMonthName}
                            </span>
                        </div>

                        {/* Expense Card */}
                        <div className="bg-red-100 border-3 border-black p-3 pop-shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                                <TrendingDown size={14} strokeWidth={3} className="text-red-600" />
                                <span className="font-black uppercase tracking-widest text-[10px] text-red-700">Pengeluaran</span>
                            </div>
                            <span className="font-black text-lg tracking-tighter text-red-600 block">
                                {formatRupiah(monthData.current.expense)}
                            </span>
                            <div className="mt-1">
                                {renderChangeIndicator(-monthData.expenseChange)}
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 block mt-0.5">
                                vs {monthData.prevMonthName}
                            </span>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className={`border-3 border-black p-3 pop-shadow-sm ${monthData.current.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-black uppercase tracking-widest text-[10px] text-gray-500">Saldo Bulan Ini</span>
                            <span className={`font-black text-xl tracking-tighter ${monthData.current.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {monthData.current.balance >= 0 ? '+' : ''}{formatRupiah(monthData.current.balance)}
                            </span>
                        </div>
                    </div>

                    {/* Visual Bar Comparison */}
                    <div className="bg-white border-3 border-black p-3">
                        <span className="font-black uppercase tracking-widest text-[10px] text-gray-500 block mb-2">Proporsi</span>
                        {(monthData.current.income + monthData.current.expense) > 0 ? (
                            <div className="w-full h-6 border-2 border-black flex overflow-hidden">
                                <div
                                    className="bg-green-500 h-full transition-all duration-700 flex items-center justify-center"
                                    style={{
                                        width: `${(monthData.current.income / (monthData.current.income + monthData.current.expense)) * 100}%`
                                    }}
                                >
                                    {monthData.current.income > 0 && (
                                        <span className="text-[9px] font-black text-white px-1 truncate">
                                            {((monthData.current.income / (monthData.current.income + monthData.current.expense)) * 100).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="bg-red-500 h-full transition-all duration-700 flex items-center justify-center"
                                    style={{
                                        width: `${(monthData.current.expense / (monthData.current.income + monthData.current.expense)) * 100}%`
                                    }}
                                >
                                    {monthData.current.expense > 0 && (
                                        <span className="text-[9px] font-black text-white px-1 truncate">
                                            {((monthData.current.expense / (monthData.current.income + monthData.current.expense)) * 100).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-6 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-400">Belum ada data</span>
                            </div>
                        )}
                        <div className="flex justify-between mt-1">
                            <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 bg-green-500 border border-black"></div>
                                <span className="text-[9px] font-bold text-gray-500">Pemasukan</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 bg-red-500 border border-black"></div>
                                <span className="text-[9px] font-bold text-gray-500">Pengeluaran</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Selector */}
                    <div className="flex border-3 border-black overflow-hidden bg-white">
                        {[
                            { id: 'both', label: 'Semua' },
                            { id: 'income', label: 'Pemasukan' },
                            { id: 'expense', label: 'Pengeluaran' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2.5 font-black uppercase tracking-widest text-[10px] transition-all border-r border-black last:border-r-0 ${activeTab === tab.id
                                    ? 'bg-black text-white'
                                    : 'bg-white text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Category Breakdown */}
                    {(activeTab === 'both' || activeTab === 'income') && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={14} strokeWidth={3} className="text-green-600" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-green-700">
                                    Detail Pemasukan
                                </h3>
                                <span className="ml-auto font-black text-sm text-green-600">
                                    {formatRupiah(monthData.incomeBreakdown.total)}
                                </span>
                            </div>
                            {renderCategoryList(monthData.incomeBreakdown, 'income')}
                        </div>
                    )}

                    {(activeTab === 'both' || activeTab === 'expense') && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown size={14} strokeWidth={3} className="text-red-600" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-red-700">
                                    Detail Pengeluaran
                                </h3>
                                <span className="ml-auto font-black text-sm text-red-600">
                                    {formatRupiah(monthData.expenseBreakdown.total)}
                                </span>
                            </div>
                            {renderCategoryList(monthData.expenseBreakdown, 'expense')}
                        </div>
                    )}

                    {/* Previous Month Comparison Table */}
                    <div className="bg-white border-3 border-black p-3">
                        <div className="flex items-center gap-2 mb-3 bg-blue-100 border-2 border-black p-2 pop-shadow-sm w-fit">
                            <RefreshCcw size={14} strokeWidth={3} className="text-blue-700" />
                            <span className="font-black uppercase tracking-widest text-[10px] text-blue-900">
                                Perbandingan sama bulan kemarin
                            </span>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="text-left font-black uppercase tracking-widest py-1.5 text-[10px]"></th>
                                    <th className="text-right font-black uppercase tracking-widest py-1.5 text-[10px] text-gray-400">{monthData.prevMonthName}</th>
                                    <th className="text-right font-black uppercase tracking-widest py-1.5 text-[10px]">{MONTH_NAMES[selectedMonth]}</th>
                                    <th className="text-right font-black uppercase tracking-widest py-1.5 text-[10px]">Selisih</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-dashed border-gray-200">
                                    <td className="py-2 font-bold text-green-700 flex items-center gap-1.5">
                                        <div className="w-5 h-5 flex items-center justify-center bg-green-100 border-2 border-black shrink-0">
                                            <TrendingUp size={12} strokeWidth={3} className="text-green-700" />
                                        </div>
                                        Masuk
                                    </td>
                                    <td className="py-2 text-right font-bold text-gray-400">{formatRupiah(monthData.prev.income)}</td>
                                    <td className="py-2 text-right font-black text-green-600">{formatRupiah(monthData.current.income)}</td>
                                    <td className={`py-2 text-right font-black ${(monthData.current.income - monthData.prev.income) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(monthData.current.income - monthData.prev.income) >= 0 ? '+' : ''}{formatRupiah(monthData.current.income - monthData.prev.income)}
                                    </td>
                                </tr>
                                <tr className="border-b border-dashed border-gray-200">
                                    <td className="py-2 font-bold text-red-700 flex items-center gap-1.5">
                                        <div className="w-5 h-5 flex items-center justify-center bg-red-100 border-2 border-black shrink-0">
                                            <TrendingDown size={12} strokeWidth={3} className="text-red-700" />
                                        </div>
                                        Keluar
                                    </td>
                                    <td className="py-2 text-right font-bold text-gray-400">{formatRupiah(monthData.prev.expense)}</td>
                                    <td className="py-2 text-right font-black text-red-600">{formatRupiah(monthData.current.expense)}</td>
                                    <td className={`py-2 text-right font-black ${(monthData.current.expense - monthData.prev.expense) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(monthData.current.expense - monthData.prev.expense) >= 0 ? '+' : ''}{formatRupiah(monthData.current.expense - monthData.prev.expense)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-black text-gray-800 flex items-center gap-1.5">
                                        <div className="w-5 h-5 flex items-center justify-center bg-yellow-300 border-2 border-black shrink-0">
                                            <Wallet size={12} strokeWidth={3} className="text-black" />
                                        </div>
                                        Saldo
                                    </td>
                                    <td className={`py-2 text-right font-bold ${monthData.prev.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatRupiah(monthData.prev.balance)}</td>
                                    <td className={`py-2 text-right font-black ${monthData.current.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(monthData.current.balance)}</td>
                                    <td className={`py-2 text-right font-black ${(monthData.current.balance - monthData.prev.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(monthData.current.balance - monthData.prev.balance) >= 0 ? '+' : ''}{formatRupiah(monthData.current.balance - monthData.prev.balance)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Notes / Catatan Bulan Ini */}
                    <div className="bg-yellow-50 border-3 border-black p-3 pop-shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={16} strokeWidth={3} className="text-yellow-600" />
                            <span className="font-black uppercase tracking-widest text-xs text-yellow-800">Catatan Bulan Ini</span>
                        </div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Tulis catatan, evaluasi, atau target untuk bulan ini..."
                            className="w-full bg-white border-2 border-black p-2 text-sm font-bold resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                            onClick={handleSaveNote}
                            disabled={isSavingNote}
                            className="mt-2 w-full bg-black text-white py-2 font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save size={14} strokeWidth={3} />
                            {isSavingNote ? 'Menyimpan...' : 'Simpan Catatan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyComparison;
