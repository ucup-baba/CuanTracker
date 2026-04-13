import React, { useMemo, useState } from 'react';
import { formatRupiah } from '../utils';
import { X, PieChart, ChevronDown, ChevronUp, FileText, ArrowRightLeft } from 'lucide-react';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';
import { WALLETS } from '../constants';

const CategorySummary = ({ transactions, type, onClose, getCategoriesForWallet, activeWallet }) => {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedSubs, setExpandedSubs] = useState({});

    const toggleCategory = (catName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catName]: !prev[catName]
        }));
    };

    const toggleSub = (catName, subName) => {
        const key = `${catName}::${subName}`;
        setExpandedSubs(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // === TRANSFER SUMMARY ===
    const transferSummary = useMemo(() => {
        if (type !== 'transfer') return null;

        const groups = {};
        let total = 0;

        transactions.forEach(t => {
            if (t.type !== 'transfer') return;

            const fromLabel = WALLETS[t.fromWallet]?.label || t.fromWallet;
            const toLabel = WALLETS[t.toWallet]?.label || t.toWallet;
            const direction = `${fromLabel} → ${toLabel}`;

            if (!groups[direction]) {
                groups[direction] = { amount: 0, transactions: [], fromWallet: t.fromWallet, toWallet: t.toWallet };
            }
            groups[direction].amount += t.amount;
            groups[direction].transactions.push(t);
            total += t.amount;
        });

        const arr = Object.keys(groups).map(key => ({
            direction: key,
            amount: groups[key].amount,
            percent: total > 0 ? (groups[key].amount / total) * 100 : 0,
            transactions: groups[key].transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
            fromWallet: groups[key].fromWallet,
            toWallet: groups[key].toWallet,
        })).sort((a, b) => b.amount - a.amount);

        return { arr, total };
    }, [transactions, type]);

    // === INCOME / EXPENSE SUMMARY ===
    const categorySummary = useMemo(() => {
        if (type === 'transfer') return null;

        const sums = {};
        let total = 0;

        transactions.forEach(t => {
            let effType = t.type;
            if (t.type === 'transfer') {
                if (activeWallet === 'asrama') {
                    if (t.fromWallet === 'asrama') effType = 'expense';
                    else if (t.toWallet === 'asrama') effType = 'income';
                } else if (activeWallet === 'putri') {
                    if (t.fromWallet === 'putri') effType = 'expense';
                    else if (t.toWallet === 'putri') effType = 'income';
                }
            }

            if (effType !== type) return;

            const catLabel = t.type === 'transfer' ? (type === 'income' ? 'Transfer Masuk' : 'Transfer Keluar') : (t.category || 'Lain-lain');
            const subCatLabel = t.type === 'transfer' ? (type === 'income' ? `Dari ${WALLETS[t.fromWallet]?.label || t.fromWallet}` : `Ke ${WALLETS[t.toWallet]?.label || t.toWallet}`) : (t.subCategory || 'Tanpa Sub');

            if (!sums[catLabel]) {
                sums[catLabel] = { amount: 0, subCategories: {} };
            }
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
    }, [transactions, type]);

    const isTransfer = type === 'transfer';
    const title = isTransfer ? 'Ringkasan Transfer' : type === 'income' ? 'Ringkasan Pemasukan' : 'Ringkasan Pengeluaran';
    const bgClass = isTransfer ? 'bg-purple-100' : type === 'income' ? 'bg-green-100' : 'bg-red-100';
    const barClass = isTransfer ? 'bg-purple-500' : type === 'income' ? 'bg-green-500' : 'bg-red-500';
    const subBarClass = isTransfer ? 'bg-purple-300' : type === 'income' ? 'bg-green-300' : 'bg-red-300';
    const amountColor = isTransfer ? 'text-purple-600' : type === 'income' ? 'text-green-600' : 'text-red-600';

    const grandTotal = isTransfer ? (transferSummary?.total || 0) : (categorySummary?.total || 0);
    const hasData = isTransfer ? (transferSummary?.arr?.length > 0) : (categorySummary?.arr?.length > 0);

    // Helper: get catData (icon, color) for a category
    const getCatData = (catName) => {
        if (!getCategoriesForWallet) return null;
        const wallets = activeWallet === 'all' ? ['pribadi', 'asrama'] : [activeWallet];
        for (const w of wallets) {
            const cats = getCategoriesForWallet(w, type);
            if (cats && cats[catName]) return cats[catName];
        }
        return null;
    };

    // Wallet color helper
    const getWalletColor = (walletId) => {
        if (walletId === 'asrama') return 'bg-indigo-400';
        if (walletId === 'pribadi') return 'bg-yellow-400';
        return 'bg-gray-400';
    };

    return (
        <div className={`border-4 border-black p-6 md:p-8 pop-shadow-sm mb-12 relative ${bgClass}`}>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white border-2 border-black p-2 hover:bg-black hover:text-white transition-colors"
                title="Tutup Ringkasan"
            >
                <X size={20} className="font-bold" />
            </button>

            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest bg-white inline-block px-4 py-2 border-2 border-black mb-6">
                {title}
            </h2>

            {/* Grand Total */}
            {hasData && (
                <div className="bg-white border-4 border-black p-4 mb-6 pop-shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-black uppercase tracking-widest text-sm text-gray-500">Total</span>
                        <span className={`font-black text-2xl md:text-3xl tracking-tighter ${amountColor}`}>
                            {formatRupiah(grandTotal)}
                        </span>
                    </div>
                </div>
            )}

            {!hasData ? (
                <div className="bg-white border-4 border-black p-8 flex flex-col items-center justify-center text-center gap-4 shadow-[4px_4px_0_0_#000]">
                    <div className="bg-gray-100 p-4 rounded-full border-4 border-black text-gray-400">
                        {isTransfer ? <ArrowRightLeft size={40} strokeWidth={2} /> : <PieChart size={40} strokeWidth={2} />}
                    </div>
                    <div>
                        <h3 className="font-black uppercase text-xl text-black">Data Masih Kosong</h3>
                        <p className="font-bold text-gray-400 mt-1">
                            Belum ada {isTransfer ? 'transfer' : type === 'income' ? 'pemasukan' : 'pengeluaran'} yang bisa dianalisis.
                        </p>
                    </div>
                </div>
            ) : isTransfer ? (
                /* ===== TRANSFER VIEW ===== */
                <div className="space-y-4">
                    {transferSummary.arr.map((group) => {
                        const isExpanded = expandedCategories[group.direction] || false;

                        return (
                            <div key={group.direction} className="bg-white border-4 border-black overflow-hidden pop-shadow-sm">
                                {/* Direction Header */}
                                <button
                                    onClick={() => toggleCategory(group.direction)}
                                    className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-gray-50 transition-colors text-left"
                                >
                                    {/* Icon box */}
                                    <div className="p-3 border-4 border-black bg-purple-400 shrink-0">
                                        <ArrowRightLeft size={24} />
                                    </div>

                                    {/* Direction + amount */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 border-2 border-black ${getWalletColor(group.fromWallet)}`}>
                                                    {WALLETS[group.fromWallet]?.label}
                                                </span>
                                                <span className="font-black text-sm">→</span>
                                                <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 border-2 border-black ${getWalletColor(group.toWallet)}`}>
                                                    {WALLETS[group.toWallet]?.label}
                                                </span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`font-black text-lg md:text-xl tracking-tighter ${amountColor}`}>
                                                    {formatRupiah(group.amount)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="w-full bg-gray-100 border-2 border-black h-4 overflow-hidden mt-2">
                                            <div
                                                className={`${barClass} h-full transition-all duration-500`}
                                                style={{ width: `${group.percent}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between mt-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                {group.percent.toFixed(1)}% dari total transfer
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                {group.transactions.length} transaksi
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expand */}
                                    <div className={`p-2 border-2 border-black shrink-0 transition-colors ${isExpanded ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                        {isExpanded ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
                                    </div>
                                </button>

                                {/* Transaction list */}
                                {isExpanded && (
                                    <div className="border-t-4 border-black bg-gray-50">
                                        {group.transactions.map((tx, txIndex) => (
                                            <div
                                                key={tx.id || txIndex}
                                                className={`flex items-center gap-3 px-5 py-3 md:px-6 md:py-4 ${txIndex < group.transactions.length - 1 ? 'border-b-2 border-dashed border-gray-300' : ''}`}
                                            >
                                                <FileText size={14} className="text-gray-400 shrink-0" strokeWidth={2.5} />
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-xs md:text-sm text-gray-800 block truncate">
                                                        {tx.text || 'Transfer'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {tx.date}
                                                    </span>
                                                </div>
                                                <span className={`font-black text-xs md:text-sm tracking-tight shrink-0 ${amountColor}`}>
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
            ) : (
                /* ===== INCOME / EXPENSE VIEW ===== */
                <div className="space-y-4">
                    {categorySummary.arr.map((item) => {
                        const catData = getCatData(item.category);
                        const isExpanded = expandedCategories[item.category] || false;
                        const colorClass = catData ? getCategoryColor(catData.color) : (type === 'income' ? 'bg-green-400' : 'bg-gray-400');
                        const iconName = catData?.icon || (type === 'income' ? 'TrendingUp' : 'Package');

                        return (
                            <div key={item.category} className="bg-white border-4 border-black overflow-hidden pop-shadow-sm">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(item.category)}
                                    className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className={`p-3 border-4 border-black ${colorClass} shrink-0`}>
                                        <CategoryIcon iconName={iconName} size={24} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="font-black uppercase tracking-widest text-sm md:text-base truncate">
                                                {item.category}
                                            </span>
                                            <div className="text-right shrink-0">
                                                <span className={`font-black text-lg md:text-xl tracking-tighter ${amountColor}`}>
                                                    {formatRupiah(item.amount)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-100 border-2 border-black h-4 overflow-hidden mt-2">
                                            <div
                                                className={`${barClass} h-full transition-all duration-500`}
                                                style={{ width: `${item.percent}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between mt-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                {item.percent.toFixed(1)}% dari total
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                {item.subCategories.length} sub-kategori
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`p-2 border-2 border-black shrink-0 transition-colors ${isExpanded ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                        {isExpanded ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
                                    </div>
                                </button>

                                {/* Sub-Categories */}
                                {isExpanded && (
                                    <div className="border-t-4 border-black bg-gray-50">
                                        {item.subCategories.map((sub, subIndex) => {
                                            const subKey = `${item.category}::${sub.name}`;
                                            const isSubExpanded = expandedSubs[subKey] || false;

                                            return (
                                                <div
                                                    key={sub.name}
                                                    className={`${subIndex < item.subCategories.length - 1 ? 'border-b-2 border-dashed border-gray-300' : ''}`}
                                                >
                                                    <button
                                                        onClick={() => toggleSub(item.category, sub.name)}
                                                        className="w-full flex items-center gap-4 px-5 py-3 md:px-6 md:py-4 hover:bg-gray-100 transition-colors text-left"
                                                    >
                                                        <div className={`w-3 h-3 border-2 border-black ${colorClass} shrink-0`}></div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="font-bold uppercase tracking-widest text-xs md:text-sm truncate text-gray-700">
                                                                    {sub.name}
                                                                </span>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-300 px-1.5 py-0.5">
                                                                        {sub.transactions.length}x
                                                                    </span>
                                                                    <span className={`font-black text-sm md:text-base tracking-tight ${amountColor}`}>
                                                                        {formatRupiah(sub.amount)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="w-full bg-white border border-gray-300 h-2 overflow-hidden mt-1.5 rounded-sm">
                                                                <div
                                                                    className={`${subBarClass} h-full transition-all duration-500`}
                                                                    style={{ width: `${sub.percent}%` }}
                                                                ></div>
                                                            </div>

                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">
                                                                {sub.percent.toFixed(1)}% dari {item.category}
                                                            </span>
                                                        </div>

                                                        <div className={`p-1 shrink-0 transition-colors ${isSubExpanded ? 'text-black' : 'text-gray-300'}`}>
                                                            {isSubExpanded ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                                                        </div>
                                                    </button>

                                                    {/* Transaction list */}
                                                    {isSubExpanded && (
                                                        <div className="bg-white border-t border-gray-200 mx-5 mb-3 md:mx-6 border-2 border-black">
                                                            {sub.transactions.map((tx, txIndex) => (
                                                                <div
                                                                    key={tx.id || txIndex}
                                                                    className={`flex items-center gap-3 px-4 py-2.5 ${txIndex < sub.transactions.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}
                                                                >
                                                                    <FileText size={14} className="text-gray-400 shrink-0" strokeWidth={2.5} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="font-bold text-xs md:text-sm text-gray-800 block truncate">
                                                                            {tx.text || '-'}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                            {tx.date}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`font-black text-xs md:text-sm tracking-tight shrink-0 ${amountColor}`}>
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
            )}
        </div>
    );
};

export default CategorySummary;
