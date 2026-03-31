import React, { useState, useEffect } from 'react';
import { CategoryIcon } from './CategoryIcon';
import { WALLETS } from '../constants';
import { Wallet, Home, ArrowRightLeft } from 'lucide-react';
import AlertModal from './AlertModal';

const TransactionForm = ({ onAddTransaction, onUpdateTransaction, getCategoriesForWallet, activeWallet, editingTransaction, setEditingTransaction }) => {
    const [text, setText] = useState('');
    const [amountDisplay, setAmountDisplay] = useState('');
    const [amountRaw, setAmountRaw] = useState(0);
    const [type, setType] = useState('expense'); // 'expense' | 'income' | 'transfer'
    const [wallet, setWallet] = useState(activeWallet !== 'all' ? activeWallet : 'pribadi');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });

    // Transfer fields
    const [fromWallet, setFromWallet] = useState('asrama');
    const [toWallet, setToWallet] = useState('pribadi');

    // Update wallet when activeWallet changes
    useEffect(() => {
        if (activeWallet !== 'all' && !editingTransaction) {
            setWallet(activeWallet);
        }
    }, [activeWallet, editingTransaction]);

    // Update form state when editingTransaction changes
    useEffect(() => {
        if (editingTransaction) {
            setText(editingTransaction.text);
            setAmountRaw(editingTransaction.amount);
            setAmountDisplay(editingTransaction.amount.toLocaleString('id-ID'));
            setType(editingTransaction.type);
            setCategory(editingTransaction.category || '');
            setSubCategory(editingTransaction.subCategory || '');
            if (editingTransaction.type === 'transfer') {
                setFromWallet(editingTransaction.fromWallet || 'asrama');
                setToWallet(editingTransaction.toWallet || 'pribadi');
            } else {
                setWallet(editingTransaction.wallet || 'pribadi');
            }
        }
    }, [editingTransaction]);

    // Get active categories based on wallet + type
    const activeCategories = type !== 'transfer' ? getCategoriesForWallet(wallet, type) : {};

    useEffect(() => {
        if (category && activeCategories[category]) {
            setSubCategory(activeCategories[category].subCategories[0] || "");
        } else {
            setSubCategory('');
        }
    }, [category, activeCategories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amountRaw || amountRaw <= 0) {
            setAlertModal({ isOpen: true, message: 'Masukkan nominal yang benar (lebih dari 0)!' });
            return;
        }

        if (type === 'transfer') {
            if (!text) { setText('Transfer'); }
            if (fromWallet === toWallet) {
                setAlertModal({ isOpen: true, message: 'Dompet asal dan tujuan tidak boleh sama!' });
                return;
            }
            const txData = {
                text: text || 'Transfer',
                amount: amountRaw,
                type: 'transfer',
                fromWallet,
                toWallet,
                wallet: fromWallet,
                category: null,
                subCategory: null,
                date: editingTransaction ? editingTransaction.date : new Date().toISOString().split('T')[0]
            };
            if (editingTransaction) {
                onUpdateTransaction(editingTransaction.id, txData);
            } else {
                onAddTransaction({ id: Math.floor(Math.random() * 100000000), ...txData });
            }
        } else {
            if (!text) {
                setAlertModal({ isOpen: true, message: 'Isi keterangan dulu Bos!' });
                return;
            }
            if (!category || !subCategory) {
                setAlertModal({ isOpen: true, message: 'Pilih Kategori dan Sub-Kategori dulu Bos!' });
                return;
            }
            const txData = {
                text,
                amount: amountRaw,
                type,
                wallet,
                category,
                subCategory,
                date: editingTransaction ? editingTransaction.date : new Date().toISOString().split('T')[0]
            };
            if (editingTransaction) {
                onUpdateTransaction(editingTransaction.id, txData);
            } else {
                onAddTransaction({ id: Math.floor(Math.random() * 100000000), ...txData });
            }
        }

        // Reset form
        setText('');
        setAmountDisplay('');
        setAmountRaw(0);
        setCategory('');
        setSubCategory('');
        if (editingTransaction) setEditingTransaction(null);
    };

    const resetSelections = () => {
        setCategory('');
        setSubCategory('');
    };

    return (
        <div className="bg-white border-4 border-black p-8 pop-shadow">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-4">Ngapain Aja<br />Duitnya?</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Pilihan Dompet */}
                <div>
                    <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">Dompet</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => { setWallet('pribadi'); resetSelections(); }}
                            className={`flex-1 py-3 border-4 border-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${wallet === 'pribadi' && type !== 'transfer' ? 'bg-yellow-400 text-black pop-shadow-sm scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            disabled={type === 'transfer'}
                        >
                            <span className="p-1 border-2 border-black bg-white"><Wallet size={16} strokeWidth={3} /></span>
                            Pribadi
                        </button>
                        <button
                            type="button"
                            onClick={() => { setWallet('asrama'); resetSelections(); }}
                            className={`flex-1 py-3 border-4 border-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${wallet === 'asrama' && type !== 'transfer' ? 'bg-indigo-400 text-white pop-shadow-sm scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            disabled={type === 'transfer'}
                        >
                            <span className="p-1 border-2 border-black bg-white text-black"><Home size={16} strokeWidth={3} /></span>
                            Asrama
                        </button>
                    </div>
                </div>

                {/* Pilihan Jenis Transaksi */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => { setType('expense'); resetSelections(); }}
                        className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-base transition-all ${type === 'expense' ? 'bg-red-500 text-white pop-shadow scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        Keluar
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('income'); resetSelections(); }}
                        className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-base transition-all ${type === 'income' ? 'bg-green-400 text-black pop-shadow scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        Masuk
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('transfer'); resetSelections(); }}
                        className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-base transition-all ${type === 'transfer' ? 'bg-purple-500 text-white pop-shadow scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        Transfer
                    </button>
                </div>

                {/* Transfer: Pilihan Asal & Tujuan */}
                {type === 'transfer' && (
                    <div className="bg-purple-50 border-4 border-black p-4 space-y-3">
                        <label className="block font-black uppercase tracking-widest text-sm bg-purple-500 text-white inline-block px-3 py-1">Arah Transfer</label>
                        <div className="flex items-center gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => { setFromWallet('asrama'); setToWallet('pribadi'); }}
                                className={`flex-1 py-3 border-4 border-black font-black uppercase text-sm flex items-center justify-center gap-2 transition-all ${fromWallet === 'asrama' ? 'bg-indigo-400 text-white pop-shadow-sm' : 'bg-gray-100 text-gray-400'}`}
                            >
                                Asrama
                            </button>
                            <ArrowRightLeft size={24} className="text-black flex-shrink-0" strokeWidth={3} />
                            <button
                                type="button"
                                onClick={() => { setFromWallet('pribadi'); setToWallet('asrama'); }}
                                className={`flex-1 py-3 border-4 border-black font-black uppercase text-sm flex items-center justify-center gap-2 transition-all ${fromWallet === 'pribadi' ? 'bg-yellow-400 text-black pop-shadow-sm' : 'bg-gray-100 text-gray-400'}`}
                            >
                                Pribadi
                            </button>
                        </div>
                        <p className="text-center font-bold uppercase text-xs text-purple-600">
                            {WALLETS[fromWallet]?.label} → {WALLETS[toWallet]?.label}
                        </p>
                    </div>
                )}

                {/* Pilihan Kategori (hanya untuk expense/income) */}
                {type !== 'transfer' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">
                                Kategori {type === 'income' ? 'Pemasukan' : 'Utama'}
                            </label>
                            <div className="flex overflow-x-auto gap-3 pb-4 snap-x">
                                {Object.keys(activeCategories).map(cat => {
                                    const catData = activeCategories[cat];
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`min-w-[80px] md:min-w-[100px] shrink-0 snap-start p-2 md:p-3 border-4 border-black flex flex-col items-center justify-center gap-1 md:gap-2 transition-transform ${category === cat ? `${catData.color || 'bg-yellow-400'} text-black pop-shadow-sm scale-110 z-10` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            title={cat}
                                        >
                                            <CategoryIcon iconName={catData.icon} size={24} />
                                            <span className="text-[10px] leading-tight font-black uppercase text-center mt-1 break-words w-full">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {category && activeCategories[category] && activeCategories[category].subCategories && activeCategories[category].subCategories.length > 0 && (
                            <div>
                                <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">Sub-Kategori</label>
                                <div className="flex flex-wrap gap-2">
                                    {activeCategories[category].subCategories.map(sub => (
                                        <button
                                            key={sub}
                                            type="button"
                                            onClick={() => setSubCategory(sub)}
                                            className={`px-4 py-2 border-4 border-black font-black uppercase text-sm transition-all ${subCategory === sub ? 'bg-yellow-400 text-black pop-shadow-sm scale-105' : 'bg-white text-gray-500 hover:bg-gray-100 hover:-translate-y-1'}`}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Input Keterangan */}
                <div>
                    <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">
                        {type === 'transfer' ? 'Catatan (Opsional)' : 'Keterangan Detail'}
                    </label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={type === 'transfer' ? 'Cth: Ambil uang asrama' : 'Contoh: Beli Kopi Susu Mantap'}
                        className="w-full bg-yellow-50 border-4 border-black p-4 font-bold text-xl uppercase placeholder:text-gray-400 focus:outline-none focus:bg-yellow-100 pop-shadow-sm transition-colors"
                        required={type !== 'transfer'}
                    />
                </div>

                {/* Input Jumlah */}
                <div>
                    <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">Jumlah (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl">Rp</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amountDisplay}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                const num = parseInt(raw, 10) || 0;
                                setAmountRaw(num);
                                setAmountDisplay(num > 0 ? num.toLocaleString('id-ID') : '');
                            }}
                            placeholder="50.000"
                            className="w-full bg-yellow-50 border-4 border-black p-4 pl-14 font-bold text-xl focus:outline-none focus:bg-yellow-100 pop-shadow-sm transition-colors"
                            required
                        />
                    </div>
                </div>

                {/* Tombol Submit */}
                <button
                    type="submit"
                    className={`w-full font-black uppercase tracking-widest text-2xl py-6 border-4 border-black transition-colors pop-shadow mt-4 ${type === 'transfer'
                        ? 'bg-purple-500 text-white hover:bg-purple-400'
                        : 'bg-black text-white hover:bg-yellow-400 hover:text-black'
                        }`}
                >
                    {editingTransaction ? 'SIMPAN PERUBAHAN!' : type === 'transfer' ? 'TRANSFER SEKARANG!' : 'CATAT SEKARANG!'}
                </button>
                {editingTransaction && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingTransaction(null);
                            setText('');
                            setAmountDisplay('');
                            setAmountRaw(0);
                            setCategory('');
                            setSubCategory('');
                        }}
                        className="w-full font-black uppercase tracking-widest text-xl py-4 border-4 border-black transition-colors mt-4 bg-white text-black hover:bg-gray-100"
                    >
                        BATAL EDIT
                    </button>
                )}
            </form>

            <AlertModal
                isOpen={alertModal.isOpen}
                message={alertModal.message}
                onClose={() => setAlertModal({ isOpen: false, message: '' })}
            />
        </div>
    );
};

export default TransactionForm;
