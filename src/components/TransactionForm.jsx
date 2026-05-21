import React, { useState, useEffect, useRef } from 'react';
import { CategoryIcon } from './CategoryIcon';
import { WALLETS } from '../constants';
import { Wallet, Home, ArrowRightLeft, Smartphone, Info, Sparkles, Loader2 } from 'lucide-react';
import AlertModal from './AlertModal';
import { parseTransaction, parseAmountId } from '../ai/aiClient';

const TransactionForm = ({ onAddTransaction, onUpdateTransaction, getCategoriesForWallet, activeWallet, editingTransaction, setEditingTransaction, availableWallets = ['pribadi', 'asrama'] }) => {
    const [text, setText] = useState('');
    const [amountDisplay, setAmountDisplay] = useState('');
    const [amountRaw, setAmountRaw] = useState(0);
    const [type, setType] = useState('expense'); // 'expense' | 'income' | 'transfer'
    const [wallet, setWallet] = useState(activeWallet !== 'all' ? activeWallet : 'pribadi');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [isEmoney, setIsEmoney] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });

    // Transfer fields
    const [fromWallet, setFromWallet] = useState('asrama');
    const [toWallet, setToWallet] = useState('pribadi');

    // AI natural-language input
    const [nlText, setNlText] = useState('');
    const [nlLoading, setNlLoading] = useState(false);
    const [nlError, setNlError] = useState('');
    const [nlOk, setNlOk] = useState('');
    const [nlAutoSave, setNlAutoSave] = useState(() => {
        try { return localStorage.getItem('cuan-nl-autosave') === '1'; } catch { return false; }
    });
    // Holds the sub-category an AI parse wants, so the auto-select effect below
    // doesn't clobber it with subCategories[0].
    const pendingSubRef = useRef(null);

    const toggleAutoSave = () => setNlAutoSave((v) => {
        const nv = !v;
        try { localStorage.setItem('cuan-nl-autosave', nv ? '1' : '0'); } catch { /* ignore */ }
        return nv;
    });

    // After AI quick-input: jump the user to where they need to look next.
    const keteranganRef = useRef(null);
    const scrollToReview = () => {
        setTimeout(() => keteranganRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    };
    const scrollToList = () => {
        setTimeout(() => document.getElementById('tx-list-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    };

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
            const subs = activeCategories[category].subCategories || [];
            // If an AI parse requested a specific sub-category, honor it once.
            if (pendingSubRef.current && subs.includes(pendingSubRef.current)) {
                setSubCategory(pendingSubRef.current);
                pendingSubRef.current = null;
            } else {
                setSubCategory(subs[0] || "");
                pendingSubRef.current = null;
            }
        } else {
            // category not (yet) valid for the current wallet/type — keep any
            // pending sub so it can apply once activeCategories catches up.
            setSubCategory('');
        }
    }, [category, activeCategories]);

    // Build the categories payload (compact: {wallet: {type: {cat: [subs]}}}) for the AI.
    const buildCategoriesPayload = () => {
        const mapCats = (obj) => Object.fromEntries(
            Object.entries(obj || {}).map(([cat, d]) => [cat, d?.subCategories || []])
        );
        const out = {};
        for (const w of availableWallets) {
            out[w] = {
                expense: mapCats(getCategoriesForWallet(w, 'expense')),
                income: mapCats(getCategoriesForWallet(w, 'income')),
            };
        }
        return out;
    };

    const applyParsed = (tx, fallbackText) => {
        const amt = Number(tx.amount) || parseAmountId(fallbackText);
        if (tx.type === 'transfer') {
            setType('transfer');
        } else {
            const t = tx.type === 'income' ? 'income' : 'expense';
            setType(t);
            const w = availableWallets.includes(tx.wallet)
                ? tx.wallet
                : (activeWallet !== 'all' ? activeWallet : wallet);
            setWallet(w);
            const cats = getCategoriesForWallet(w, t);
            if (tx.category && cats && cats[tx.category]) {
                pendingSubRef.current = tx.subCategory || null;
                setCategory(tx.category);
            } else {
                setCategory('');
            }
        }
        setText(tx.text || fallbackText.toUpperCase());
        setAmountRaw(amt);
        setAmountDisplay(amt > 0 ? amt.toLocaleString('id-ID') : '');
    };

    // Build a ready-to-save transaction from an AI parse, or null if not
    // confident enough (missing/invalid category, sub, or amount).
    const buildAutoTx = (tx, q) => {
        if (!tx || tx.type === 'transfer') return null;
        const t = tx.type === 'income' ? 'income' : 'expense';
        const w = availableWallets.includes(tx.wallet) ? tx.wallet : (activeWallet !== 'all' ? activeWallet : wallet);
        const cats = getCategoriesForWallet(w, t);
        if (!tx.category || !cats || !cats[tx.category]) return null;
        const subs = cats[tx.category].subCategories || [];
        let sub = tx.subCategory;
        if (subs.length) { if (!subs.includes(sub)) sub = subs[0]; } else { sub = sub || ''; }
        if (subs.length && !sub) return null;
        const amount = Number(tx.amount) || parseAmountId(q);
        if (!amount || amount <= 0) return null;
        return {
            id: Math.floor(Math.random() * 100000000),
            text: tx.text || q.toUpperCase(),
            amount,
            type: t,
            wallet: w,
            category: tx.category,
            subCategory: sub,
            date: new Date().toISOString().split('T')[0],
        };
    };

    const handleNlParse = async () => {
        const q = nlText.trim();
        if (!q) return;
        setNlError('');
        setNlOk('');
        setNlLoading(true);
        try {
            const tx = await parseTransaction({
                text: q,
                wallets: availableWallets,
                categories: buildCategoriesPayload(),
                defaultWallet: activeWallet !== 'all' ? activeWallet : wallet,
            });
            if (!tx) {
                setNlError('AI tidak mengembalikan hasil. Coba lagi atau isi manual.');
                return;
            }
            if (nlAutoSave) {
                const auto = buildAutoTx(tx, q);
                if (auto) {
                    onAddTransaction(auto);
                    setNlOk(`✅ Tersimpan: ${auto.text} — Rp${auto.amount.toLocaleString('id-ID')}`);
                    setNlText('');
                    scrollToList();
                    return;
                }
                // Not confident -> fall back to manual confirm.
                applyParsed(tx, q);
                setNlError('AI kurang yakin (kategori/nominal) — cek & simpan manual ya.');
                scrollToReview();
                return;
            }
            applyParsed(tx, q);
            setNlText('');
            scrollToReview();
        } catch (e) {
            // Fallback: at least fill amount + description locally.
            const amt = parseAmountId(q);
            if (amt) { setAmountRaw(amt); setAmountDisplay(amt.toLocaleString('id-ID')); }
            setText(q.toUpperCase());
            setNlError('AI gagal — terisi sebagian. ' + (e?.message || ''));
        } finally {
            setNlLoading(false);
        }
    };

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
            const currentDate = editingTransaction ? editingTransaction.date : new Date().toISOString().split('T')[0];

            // E-money mode: create TWO transactions (income offset + expense)
            if (isEmoney && type === 'expense' && (wallet === 'pribadi' || wallet === 'putri') && !editingTransaction) {
                // 1. Income transaction: Lain-lain Masuk / Transfer Masuk
                const incomeTx = {
                    id: Math.floor(Math.random() * 100000000),
                    text: `[E-Money] ${text}`,
                    amount: amountRaw,
                    type: 'income',
                    wallet: wallet,
                    category: 'Lain-lain Masuk',
                    subCategory: 'Transfer Masuk',
                    date: currentDate,
                    isEmoney: true,
                };
                onAddTransaction(incomeTx);

                // 2. Expense transaction: as selected
                const expenseTx = {
                    id: Math.floor(Math.random() * 100000000),
                    text: `[E-Money] ${text}`,
                    amount: amountRaw,
                    type: 'expense',
                    wallet: wallet,
                    category,
                    subCategory,
                    date: currentDate,
                    isEmoney: true,
                };
                onAddTransaction(expenseTx);
            } else {
                const txData = {
                    text,
                    amount: amountRaw,
                    type,
                    wallet,
                    category,
                    subCategory,
                    date: currentDate,
                };
                if (editingTransaction) {
                    onUpdateTransaction(editingTransaction.id, txData);
                } else {
                    onAddTransaction({ id: Math.floor(Math.random() * 100000000), ...txData });
                }
            }
        }

        // Reset form
        setText('');
        setAmountDisplay('');
        setAmountRaw(0);
        setCategory('');
        setSubCategory('');
        setIsEmoney(false);
        if (editingTransaction) setEditingTransaction(null);
    };

    const resetSelections = () => {
        setCategory('');
        setSubCategory('');
    };

    return (
        <div className="bg-white border-4 border-black p-8 pop-shadow transaction-form-card">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-4 form-heading">Ngapain Aja<br />Duitnya?</h2>

            {/* AI quick input (natural language) */}
            {!editingTransaction && (
                <div className="mb-8 bg-yellow-50 border-4 border-black p-3 pop-shadow-sm ai-quick-card">
                    <label className="flex items-center gap-2 font-black uppercase tracking-widest text-sm bg-black text-white inline-flex px-3 py-1">
                        <Sparkles size={14} strokeWidth={3} /> Input Cepat (AI)
                    </label>
                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            value={nlText}
                            onChange={(e) => setNlText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNlParse(); } }}
                            placeholder="Cth: kopi 15rb di asrama"
                            disabled={nlLoading}
                            className="flex-1 min-w-0 bg-white border-4 border-black p-3 font-bold focus:outline-none focus:bg-yellow-100 transition-colors disabled:opacity-60 ai-quick-input"
                        />
                        <button
                            type="button"
                            onClick={handleNlParse}
                            disabled={nlLoading || !nlText.trim()}
                            title="Isi otomatis dengan AI"
                            className="shrink-0 bg-black text-white font-black uppercase px-4 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center ai-quick-action"
                        >
                            {nlLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} strokeWidth={2.5} />}
                        </button>
                    </div>

                    {/* Auto-save toggle */}
                    <button
                        type="button"
                        onClick={toggleAutoSave}
                        className={`mt-2 flex items-center gap-2 px-3 py-1.5 border-3 border-black font-black uppercase tracking-wider text-[11px] transition-all ${nlAutoSave ? 'bg-green-400 text-black pop-shadow-sm' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                        title="Kalau ON, transaksi langsung disimpan tanpa konfirmasi"
                    >
                        Simpan Otomatis
                        <span className={`w-8 h-4 border-2 border-black relative inline-block transition-all ${nlAutoSave ? 'bg-green-600' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0 w-3 h-3 bg-white border-2 border-black transition-all ${nlAutoSave ? 'left-4' : 'left-0'}`} />
                        </span>
                    </button>

                    {nlOk
                        ? <p className="text-xs font-bold text-green-600 mt-2">{nlOk}</p>
                        : nlError
                            ? <p className="text-xs font-bold text-red-500 mt-2">{nlError}</p>
                            : <p className="text-[11px] font-bold text-gray-400 mt-2">{nlAutoSave ? 'Mode simpan otomatis ON — transaksi langsung dicatat tanpa konfirmasi.' : 'Ketik transaksi pakai bahasa biasa, form keisi otomatis untuk kamu cek.'}</p>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Pilihan Dompet */}
                {availableWallets.length > 1 && (
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
                )}

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
                    {availableWallets.length > 1 && (
                        <button
                            type="button"
                            onClick={() => { setType('transfer'); resetSelections(); }}
                            className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-base transition-all ${type === 'transfer' ? 'bg-purple-500 text-white pop-shadow scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                            Transfer
                        </button>
                    )}
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
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <label className="font-black uppercase tracking-widest text-sm bg-black text-white inline-block px-3 py-1">
                                    Kategori {type === 'income' ? 'Pemasukan' : 'Utama'}
                                </label>

                                {/* E-money Toggle - Only for Pribadi Expense */}
                                {type === 'expense' && (wallet === 'pribadi' || wallet === 'putri') && !editingTransaction && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEmoney(!isEmoney)}
                                        className={`flex items-center gap-2 px-3 py-1 border-3 border-black font-black uppercase tracking-wider text-xs transition-all ${
                                            isEmoney
                                                ? 'bg-cyan-400 text-black pop-shadow-sm scale-105'
                                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                        }`}
                                    >
                                        <Smartphone size={14} strokeWidth={3} />
                                        E-Money
                                        <span className={`w-8 h-4 border-2 border-black relative inline-block transition-all ${
                                            isEmoney ? 'bg-green-400' : 'bg-gray-300'
                                        }`}>
                                            <span className={`absolute top-0 w-3 h-3 bg-white border-2 border-black transition-all ${
                                                isEmoney ? 'left-4' : 'left-0'
                                            }`} />
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* E-money Info Banner */}
                            {isEmoney && type === 'expense' && (wallet === 'pribadi' || wallet === 'putri') && (
                                <div className="bg-cyan-50 border-4 border-cyan-400 p-3 mb-3 flex items-start gap-2">
                                    <Info size={18} className="text-cyan-600 mt-0.5 shrink-0" strokeWidth={3} />
                                    <p className="text-xs font-bold text-cyan-800 leading-relaxed">
                                        <span className="uppercase font-black">Mode E-Money ON!</span> Sistem akan otomatis membuat 2 transaksi:
                                        <span className="text-green-600"> +Masuk</span> (Lain-lain Masuk / Transfer Masuk) &
                                        <span className="text-red-500"> -Keluar</span> (sesuai kategori). Saldo cash tetap aman karena yang bayar e-money!
                                    </p>
                                </div>
                            )}
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
                <div ref={keteranganRef} className="scroll-mt-24">
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
