import React, { useState } from 'react';
import { Trash2, TrendingUp, ArrowRightLeft, Edit3, Search, SearchX, Receipt } from 'lucide-react';
import { formatRupiah } from '../utils';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';
import { WALLETS } from '../constants';
import ConfirmModal from './ConfirmModal';

const TransactionList = ({ transactions, deleteTransaction, getCategoriesForWallet, activeWallet, setEditingTransaction, searchQuery, setSearchQuery }) => {
    const [visibleCount, setVisibleCount] = useState(20);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, txId: null });

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    const confirmDeleteTransaction = () => {
        deleteTransaction(confirmModal.txId);
        setConfirmModal({ isOpen: false, txId: null });
    };

    const visibleTransactions = transactions.slice(0, visibleCount);
    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={20} className="font-bold text-black" strokeWidth={3} />
                </span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="CARI NAMA, KATEGORI, ATAU SUB-KATEGORI..."
                    className="w-full bg-white border-4 border-black p-4 pl-12 font-black uppercase text-sm md:text-base focus:outline-none focus:bg-yellow-50 pop-shadow-sm transition-colors placeholder:text-gray-300"
                />
            </div>

            {transactions.length === 0 ? (
                <div className="bg-white border-4 border-black p-12 flex flex-col items-center justify-center text-center border-dashed gap-4 shadow-[4px_4px_0_0_#000]">
                    {searchQuery ? (
                        <>
                            <div className="bg-gray-100 p-4 rounded-full border-4 border-black text-gray-400">
                                <SearchX size={48} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase text-2xl text-black">Nggak Ketemu Bos!</h3>
                                <p className="font-bold text-gray-400 mt-2">Coba cari pakai kata kunci lain.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-yellow-100 p-4 rounded-full border-4 border-black text-yellow-500">
                                <Receipt size={48} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase text-2xl text-black">Dompet Masih Suci</h3>
                                <p className="font-bold text-gray-400 mt-2">Belum ada transaksi nih, yuk catat pengeluaran pertamamu!</p>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <>
                    {visibleTransactions.map((t) => {
                        const isTransfer = t.type === 'transfer';
                        const txWallet = t.wallet || 'pribadi';

                        // Get category data based on transaction wallet
                        let catData = null;
                        if (!isTransfer && t.category) {
                            const cats = getCategoriesForWallet(txWallet, t.type);
                            catData = cats[t.category] || null;
                        }

                        // Border color
                        let borderColor = 'border-l-red-500';
                        if (isTransfer) borderColor = 'border-l-purple-500';
                        else if (t.type === 'income') borderColor = 'border-l-green-400';

                        // For transfer: determine if this is income or expense relative to active wallet
                        let transferDirection = '';
                        if (isTransfer) {
                            if (activeWallet === 'all') {
                                transferDirection = `${WALLETS[t.fromWallet]?.label || ''} → ${WALLETS[t.toWallet]?.label || ''}`;
                            } else if (t.fromWallet === activeWallet) {
                                transferDirection = `→ ${WALLETS[t.toWallet]?.label || ''}`;
                            } else {
                                transferDirection = `← ${WALLETS[t.fromWallet]?.label || ''}`;
                            }
                        }

                        return (
                            <div
                                key={t.id}
                                className={`group flex justify-between items-center bg-white border-4 border-black p-4 md:p-6 pop-shadow-sm hover:translate-x-2 transition-transform border-l-[12px] ${borderColor}`}
                            >
                                <div className="flex items-center gap-4 md:gap-6">
                                    {/* Ikon */}
                                    {isTransfer ? (
                                        <div className="p-3 border-4 border-black bg-purple-400 pop-shadow-sm hidden sm:block">
                                            <ArrowRightLeft size={28} />
                                        </div>
                                    ) : catData ? (
                                        <div className={`p-3 border-4 border-black ${getCategoryColor(catData.color)} pop-shadow-sm hidden sm:block`}>
                                            <CategoryIcon iconName={catData.icon} size={28} />
                                        </div>
                                    ) : t.type === 'income' ? (
                                        <div className="p-3 border-4 border-black bg-green-400 pop-shadow-sm hidden sm:block">
                                            <TrendingUp size={28} />
                                        </div>
                                    ) : null}

                                    <div>
                                        <h4 className="font-black uppercase tracking-tight text-xl md:text-2xl">{t.text}</h4>

                                        <div className="flex flex-wrap gap-2 mt-2 mb-1">
                                            {/* Wallet Badge */}
                                            {activeWallet === 'all' && !isTransfer && (
                                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-2 py-1 border-2 border-black ${txWallet === 'asrama' ? 'bg-indigo-300 text-black' : 'bg-yellow-300 text-black'} hover:-translate-y-0.5 transition-transform`}>
                                                    {WALLETS[txWallet]?.label}
                                                </span>
                                            )}

                                            {/* Transfer direction */}
                                            {isTransfer && (
                                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest bg-purple-200 text-black px-2 py-1 border-2 border-black hover:-translate-y-0.5 transition-transform">
                                                    {transferDirection}
                                                </span>
                                            )}

                                            {/* Sub-Kategori tag */}
                                            {!isTransfer && t.subCategory && (
                                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest text-black px-2 py-1 border-2 border-black hover:-translate-y-0.5 transition-transform ${t.type === 'income' ? 'bg-green-200' : 'bg-yellow-300'}`}>
                                                    {t.subCategory}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{t.date}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`font-black text-xl md:text-3xl tracking-tighter whitespace-nowrap ${isTransfer ? 'text-purple-600'
                                        : t.type === 'income' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {isTransfer ? '' : t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                                    </span>
                                    <button
                                        onClick={() => setEditingTransaction(t)}
                                        className="bg-yellow-400 text-black p-3 border-2 border-black hover:bg-yellow-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                        title="Edit"
                                    >
                                        <Edit3 size={20} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, txId: t.id })}
                                        className="bg-black text-white p-3 border-2 border-black hover:bg-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                        title="Hapus"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {visibleCount < transactions.length && (
                        <button
                            onClick={handleLoadMore}
                            className="w-full font-black uppercase tracking-widest text-xl py-4 border-4 border-black transition-colors mt-6 bg-yellow-400 text-black hover:bg-black hover:text-white pop-shadow"
                        >
                            MUAT LEBIH BANYAK! (- {transactions.length - visibleCount} sisa -)
                        </button>
                    )}
                </>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Hapus Transaksi?"
                message="Yakin mau hapus transaksi ini? 🗑️"
                onConfirm={confirmDeleteTransaction}
                onCancel={() => setConfirmModal({ isOpen: false, txId: null })}
            />
        </div>
    );
};

export default TransactionList;
