import React, { useMemo, useState } from 'react';
import { formatRupiah } from '../utils';
import {
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    TrendingUp, TrendingDown, FileText, BarChart3, Calendar, Minus, Wallet, RefreshCcw, ArrowLeft
} from 'lucide-react';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';
import {
    defaultAsramaCategories, defaultAsramaIncomeCategories,
    defaultPutriCategories, defaultPutriIncomeCategories
} from '../constants';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const PengurusMonthlyComparison = ({ putraTransactions, putriTransactions, onClose }) => {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    
    // Filters
    const [sourceFilter, setSourceFilter] = useState('both'); // 'both', 'putra', 'putri'
    const [typeFilter, setTypeFilter] = useState('both'); // 'both', 'income', 'expense'

    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedSubs, setExpandedSubs] = useState({});

    const monthData = useMemo(() => {
        // Prepare combined/filtered transactions based on source
        let targetTxs = [];
        if (sourceFilter === 'both' || sourceFilter === 'putra') {
            targetTxs = [...targetTxs, ...putraTransactions.map(t => ({ ...t, source: 'putra' }))];
        }
        if (sourceFilter === 'both' || sourceFilter === 'putri') {
            targetTxs = [...targetTxs, ...putriTransactions.map(t => ({ ...t, source: 'putri' }))];
        }

        const filterByMonth = (txs, month, year) => {
            return txs.filter(t => {
                if (t.type === 'transfer') return false; 
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year;
            });
        };

        const currentMonthTxs = filterByMonth(targetTxs, selectedMonth, selectedYear);

        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        const prevMonthTxs = filterByMonth(targetTxs, prevMonth, prevYear);

        const calcTotals = (txs) => {
            let income = 0, expense = 0;
            // Also detail by source for proportion display
            let putraIncome = 0, putriIncome = 0;
            let putraExpense = 0, putriExpense = 0;

            txs.forEach(t => {
                if (t.type === 'income') {
                    income += t.amount;
                    if (t.source === 'putra') putraIncome += t.amount; else putriIncome += t.amount;
                } else if (t.type === 'expense') {
                    expense += t.amount;
                    if (t.source === 'putra') putraExpense += t.amount; else putriExpense += t.amount;
                }
            });
            return { income, expense, balance: income - expense, putraIncome, putriIncome, putraExpense, putriExpense };
        };

        const current = calcTotals(currentMonthTxs);
        const prev = calcTotals(prevMonthTxs);

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
                        percent: sums[key].amount > 0 ? (sums[key].subCategories[subKey].amount / sums[key].amount) * 100 : 0,
                        transactions: sums[key].subCategories[subKey].transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
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
    }, [putraTransactions, putriTransactions, selectedMonth, selectedYear, sourceFilter]);

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

    const toggleCategory = (key) => setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleSub = (catKey, subName) => {
        const key = `${catKey}::${subName}`;
        setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const getCatData = (catName, type) => {
        // Fallback checks from both putra and putri constant categories
        let cat = null;
        if (type === 'income') {
            cat = defaultAsramaIncomeCategories[catName] || defaultPutriIncomeCategories[catName];
        } else {
            cat = defaultAsramaCategories[catName] || defaultPutriCategories[catName];
        }
        return cat || null;
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
                        Belum ada {type === 'income' ? 'pemasukan' : 'pengeluaran'} sesuai filter di bulan ini.
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
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                                            {item.percent.toFixed(1)}%
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 shrink-0">
                                            {item.subCategories.length} sub
                                        </span>
                                    </div>
                                </div>
                                <div className={`p-1 border-2 border-black shrink-0 transition-colors ${isExpanded ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                    {isExpanded ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="border-t-3 border-black bg-gray-50">
                                    {item.subCategories.map((sub, subIndex) => {
                                        const subKey = `${catKey}::${sub.name}`;
                                        const isSubExpanded = expandedSubs[subKey] || false;

                                        return (
                                            <div key={sub.name} className={`${subIndex < item.subCategories.length - 1 ? 'border-b-2 border-dashed border-gray-300' : ''}`}>
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
                                                    </div>
                                                    <div className={`p-0.5 shrink-0 transition-colors ${isSubExpanded ? 'text-black' : 'text-gray-300'}`}>
                                                        {isSubExpanded ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                                                    </div>
                                                </button>

                                                {isSubExpanded && (
                                                    <div className="bg-white border-t border-gray-200 mx-4 mb-2 border-2 border-black">
                                                        {sub.transactions.map((tx, txIndex) => (
                                                            <div
                                                                key={tx.id || txIndex}
                                                                className={`flex gap-2 px-3 py-2 ${txIndex < sub.transactions.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}
                                                            >
                                                                <div className="mt-0.5">
                                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border border-black ${tx.source === 'putra' ? 'bg-blue-200 text-blue-800' : 'bg-pink-200 text-pink-800'}`}>
                                                                        <span className="text-[8px] font-black">{tx.source === 'putra' ? 'L' : 'P'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-bold text-[11px] text-gray-800 block">
                                                                        {tx.text || '-'}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">
                                                                        {tx.date} • {tx.source === 'putra' ? 'Putra' : 'Putri'}
                                                                    </span>
                                                                </div>
                                                                <span className={`font-black text-[11px] tracking-tight shrink-0 flex items-center ${amountColor}`}>
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
        <div className="min-h-full bg-pink-100 flex flex-col pt-[72px]" style={{ backgroundImage: 'radial-gradient(#00000010 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
            {/* Header (Full Page Override) */}
            <div className="fixed top-0 left-0 w-full bg-black text-white z-50 h-[72px] flex items-center px-4 justify-between pop-shadow">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 bg-white text-black border-2 border-black pop-shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all">
                        <ArrowLeft size={20} strokeWidth={3} />
                    </button>
                    <div className="flex items-center gap-2">
                        <BarChart3 size={24} strokeWidth={3} className="text-yellow-400" />
                        <div>
                            <h2 className="font-black uppercase text-base tracking-wider leading-none">Statistik</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Dashboard Pengurus</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Ribbons */}
            <div className="bg-white border-b-4 border-black shrink-0 px-4 py-3 flex flex-col sm:flex-row gap-3">
                {/* Source Filter */}
                <div className="flex flex-1 border-3 border-black p-1 bg-gray-100 pop-shadow-sm rounded-sm">
                    {[
                        { id: 'both', label: 'Gabungan' },
                        { id: 'putra', label: 'Kas Putra' },
                        { id: 'putri', label: 'Kas Putri' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSourceFilter(f.id)}
                            className={`flex-1 py-1.5 font-black uppercase text-[10px] tracking-widest rounded-sm transition-all ${sourceFilter === f.id ? 'bg-black text-white pop-shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {/* Type Filter */}
                <div className="flex flex-1 border-3 border-black p-1 bg-gray-100 pop-shadow-sm rounded-sm">
                    {[
                        { id: 'both', label: 'Semua Status' },
                        { id: 'income', label: 'Pemasukan' },
                        { id: 'expense', label: 'Pengeluaran' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setTypeFilter(f.id)}
                            className={`flex-1 py-1.5 font-black uppercase text-[10px] tracking-widest rounded-sm transition-all ${typeFilter === f.id ? 'bg-black text-white pop-shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Month Navigation */}
            <div className="bg-yellow-400 border-b-4 border-black px-4 py-2.5 flex items-center justify-between shrink-0">
                <button
                    onClick={goToPrevMonth}
                    className="p-2 border-3 border-black bg-white hover:bg-gray-100 transition-colors active:scale-95 pop-shadow-sm"
                >
                    <ChevronLeft size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-2 bg-white px-4 py-1.5 border-3 border-black pop-shadow-sm">
                    <Calendar size={18} strokeWidth={2.5} />
                    <span className="font-black uppercase tracking-widest text-sm text-black">
                        {MONTH_NAMES[selectedMonth]} {selectedYear}
                    </span>
                </div>
                <button
                    onClick={goToNextMonth}
                    className="p-2 border-3 border-black bg-white hover:bg-gray-100 transition-colors active:scale-95 pop-shadow-sm"
                >
                    <ChevronRight size={18} strokeWidth={3} />
                </button>
            </div>

            {/* Main Content Scrollable Area */}
            <div className="flex-1 w-full max-w-3xl mx-auto p-4 space-y-5 pb-20">
                
                {/* Visual Proportion (Putra vs Putri) ONLY if Gabungan */}
                {sourceFilter === 'both' && (
                    <div className="bg-white border-3 border-black p-4 pop-shadow-sm">
                        <span className="font-black uppercase tracking-widest text-[10px] text-gray-500 block mb-3 text-center">
                            Proporsi Sumber Kas (% Total Putaran Uang)
                        </span>
                        {(monthData.current.income + monthData.current.expense) > 0 ? (
                            <>
                                <div className="w-full h-8 border-3 border-black flex overflow-hidden">
                                    <div
                                        className="bg-blue-400 h-full transition-all duration-700 flex items-center justify-center"
                                        style={{ width: `${((monthData.current.putraIncome + monthData.current.putraExpense) / ((monthData.current.income + monthData.current.expense) || 1)) * 100}%` }}
                                    >
                                        <span className="text-[10px] font-black text-black px-1 truncate drop-shadow-md">
                                            Putra {(((monthData.current.putraIncome + monthData.current.putraExpense) / ((monthData.current.income + monthData.current.expense) || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div
                                        className="bg-pink-400 h-full transition-all duration-700 flex items-center justify-center border-l-2 border-black"
                                        style={{ width: `${((monthData.current.putriIncome + monthData.current.putriExpense) / ((monthData.current.income + monthData.current.expense) || 1)) * 100}%` }}
                                    >
                                        <span className="text-[10px] font-black text-black px-1 truncate drop-shadow-md">
                                            Putri {(((monthData.current.putriIncome + monthData.current.putriExpense) / ((monthData.current.income + monthData.current.expense) || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-8 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Belum ada data</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-100 border-3 border-black p-4 pop-shadow">
                        <div className="flex items-center gap-1.5 mb-2">
                            <TrendingUp size={16} strokeWidth={3} className="text-green-600" />
                            <span className="font-black uppercase tracking-widest text-[11px] text-green-700">Pemasukan</span>
                        </div>
                        <span className="font-black text-xl tracking-tighter text-green-600 block mb-2 leading-none">
                            {formatRupiah(monthData.current.income)}
                        </span>
                        <div className="mt-1">
                            {renderChangeIndicator(monthData.incomeChange)}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 block mt-1">
                            vs {monthData.prevMonthName}
                        </span>
                    </div>

                    <div className="bg-red-100 border-3 border-black p-4 pop-shadow">
                        <div className="flex items-center gap-1.5 mb-2">
                            <TrendingDown size={16} strokeWidth={3} className="text-red-600" />
                            <span className="font-black uppercase tracking-widest text-[11px] text-red-700">Pengeluaran</span>
                        </div>
                        <span className="font-black text-xl tracking-tighter text-red-600 block mb-2 leading-none">
                            {formatRupiah(monthData.current.expense)}
                        </span>
                        <div className="mt-1">
                            {renderChangeIndicator(-monthData.expenseChange)}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 block mt-1">
                            vs {monthData.prevMonthName}
                        </span>
                    </div>
                </div>

                <div className={`border-3 border-black p-4 pop-shadow ${monthData.current.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-center">
                        <span className="font-black uppercase tracking-widest text-xs text-gray-600">Saldo Filter Ini</span>
                        <span className={`font-black text-2xl tracking-tighter shrink-0 ${monthData.current.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {monthData.current.balance >= 0 ? '+' : ''}{formatRupiah(monthData.current.balance)}
                        </span>
                    </div>
                </div>

                {/* Performance Comparison Table */}
                <div className="bg-white border-3 border-black p-4 pop-shadow-sm overflow-x-auto">
                    <div className="flex items-center gap-2 mb-4 bg-blue-100 border-2 border-black p-2 pop-shadow-sm w-fit">
                        <RefreshCcw size={14} strokeWidth={3} className="text-blue-700" />
                        <span className="font-black uppercase tracking-widest text-[10px] text-blue-900">
                            Performansi Komparatif
                        </span>
                    </div>
                    <table className="w-full text-xs min-w-[300px]">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="text-left font-black uppercase tracking-widest py-2 text-[10px] w-1/4">Indikator</th>
                                <th className="text-right font-black uppercase tracking-widest py-2 text-[10px] text-gray-400 w-1/4">{monthData.prevMonthName}</th>
                                <th className="text-right font-black uppercase tracking-widest py-2 text-[10px] w-1/4">{MONTH_NAMES[selectedMonth]}</th>
                                <th className="text-right font-black uppercase tracking-widest py-2 text-[10px] w-1/4">Selisih</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-dashed border-gray-200">
                                <td className="py-3 font-bold text-green-700 flex items-center gap-1.5">
                                    <div className="w-6 h-6 flex flex-shrink-0 items-center justify-center bg-green-100 border-2 border-black">
                                        <TrendingUp size={14} strokeWidth={3} className="text-green-700" />
                                    </div>
                                    Masuk
                                </td>
                                <td className="py-3 text-right font-bold text-gray-400">{formatRupiah(monthData.prev.income)}</td>
                                <td className="py-3 text-right font-black text-green-600">{formatRupiah(monthData.current.income)}</td>
                                <td className={`py-3 text-right font-black ${(monthData.current.income - monthData.prev.income) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(monthData.current.income - monthData.prev.income) >= 0 ? '+' : ''}{formatRupiah(monthData.current.income - monthData.prev.income)}
                                </td>
                            </tr>
                            <tr className="border-b border-dashed border-gray-200">
                                <td className="py-3 font-bold text-red-700 flex items-center gap-1.5">
                                    <div className="w-6 h-6 flex flex-shrink-0 items-center justify-center bg-red-100 border-2 border-black">
                                        <TrendingDown size={14} strokeWidth={3} className="text-red-700" />
                                    </div>
                                    Keluar
                                </td>
                                <td className="py-3 text-right font-bold text-gray-400">{formatRupiah(monthData.prev.expense)}</td>
                                <td className="py-3 text-right font-black text-red-600">{formatRupiah(monthData.current.expense)}</td>
                                <td className={`py-3 text-right font-black ${(monthData.current.expense - monthData.prev.expense) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(monthData.current.expense - monthData.prev.expense) >= 0 ? '+' : ''}{formatRupiah(monthData.current.expense - monthData.prev.expense)}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3 font-black text-gray-800 flex items-center gap-1.5">
                                    <div className="w-6 h-6 flex flex-shrink-0 items-center justify-center bg-yellow-300 border-2 border-black">
                                        <Wallet size={14} strokeWidth={3} className="text-black" />
                                    </div>
                                    Saldo
                                </td>
                                <td className={`py-3 text-right font-bold ${monthData.prev.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatRupiah(monthData.prev.balance)}</td>
                                <td className={`py-3 text-right font-black ${monthData.current.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(monthData.current.balance)}</td>
                                <td className={`py-3 text-right font-black ${(monthData.current.balance - monthData.prev.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(monthData.current.balance - monthData.prev.balance) >= 0 ? '+' : ''}{formatRupiah(monthData.current.balance - monthData.prev.balance)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Category Breakdown */}
                {(typeFilter === 'both' || typeFilter === 'income') && (
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3 bg-green-200 border-3 border-black p-2.5 pop-shadow-sm inline-flex">
                            <TrendingUp size={16} strokeWidth={3} className="text-green-800" />
                            <h3 className="font-black uppercase tracking-widest text-xs text-green-900">
                                Detail Pemasukan
                            </h3>
                        </div>
                        {renderCategoryList(monthData.incomeBreakdown, 'income')}
                    </div>
                )}

                {(typeFilter === 'both' || typeFilter === 'expense') && (
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3 bg-red-200 border-3 border-black p-2.5 pop-shadow-sm inline-flex">
                            <TrendingDown size={16} strokeWidth={3} className="text-red-800" />
                            <h3 className="font-black uppercase tracking-widest text-xs text-red-900">
                                Detail Pengeluaran
                            </h3>
                        </div>
                        {renderCategoryList(monthData.expenseBreakdown, 'expense')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PengurusMonthlyComparison;
