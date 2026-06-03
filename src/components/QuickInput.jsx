import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, RotateCcw, Wallet, Home, ChevronDown } from 'lucide-react';
import { parseTransaction, parseAmountId } from '../ai/aiClient';
import { formatRupiah } from '../utils';
import { WALLETS } from '../constants';

// Quick AI transaction input as an overlay panel (opened from the bottom nav).
// Appears like the assistant: X to close (top-right), swipe left/right to close.
const QuickInput = ({ isOpen, onClose, getCategoriesForWallet, availableWallets = [], activeWallet, onAddTransaction, theme, showWalletToggle = false }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [previewList, setPreviewList] = useState([]); // candidate tx(s) awaiting confirm
    const [expandedPreviewId, setExpandedPreviewId] = useState(null);
    const [savedList, setSavedList] = useState([]); // saved tx(s) (success)
    const [selectedWallet, setSelectedWallet] = useState(() => (
        activeWallet && activeWallet !== 'all' ? activeWallet : (availableWallets[0] || 'pribadi')
    ));
    const [autoSave, setAutoSave] = useState(() => {
        try { return localStorage.getItem('cuan-nl-autosave') === '1'; } catch { return false; }
    });
    const touchRef = useRef(null);
    const inputRef = useRef(null);

    const accent = theme?.accentPrimary || 'bg-yellow-400';
    const quickWallet = availableWallets.includes(selectedWallet)
        ? selectedWallet
        : (activeWallet && activeWallet !== 'all' && availableWallets.includes(activeWallet)
            ? activeWallet
            : (availableWallets[0] || 'pribadi'));
    const quickWallets = showWalletToggle && availableWallets.length > 1 ? [quickWallet] : availableWallets;
    const showWalletPicker = showWalletToggle && availableWallets.length > 1;

    // Reset state whenever the panel is closed.
    useEffect(() => {
        if (!isOpen) {
            setText(''); setError(''); setNotice(''); setPreviewList([]); setExpandedPreviewId(null); setSavedList([]); setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeWallet && activeWallet !== 'all' && availableWallets.includes(activeWallet)) {
            setSelectedWallet(activeWallet);
        } else if (!availableWallets.includes(selectedWallet)) {
            setSelectedWallet(availableWallets[0] || 'pribadi');
        }
    }, [activeWallet, availableWallets, selectedWallet]);

    if (!isOpen) return null;

    const toggleAutoSave = () => setAutoSave((v) => {
        const nv = !v;
        try { localStorage.setItem('cuan-nl-autosave', nv ? '1' : '0'); } catch { /* ignore */ }
        return nv;
    });

    const buildCategoriesPayload = () => {
        const mapCats = (obj) => Object.fromEntries(
            Object.entries(obj || {}).map(([cat, d]) => [cat, d?.subCategories || []])
        );
        const out = {};
        for (const w of quickWallets) {
            out[w] = {
                expense: mapCats(getCategoriesForWallet(w, 'expense')),
                income: mapCats(getCategoriesForWallet(w, 'income')),
            };
        }
        return out;
    };

    const buildTx = (tx, q) => {
        if (!tx || tx.type === 'transfer') return null; // panel only handles expense/income
        const t = tx.type === 'income' ? 'income' : 'expense';
        const w = quickWallets.includes(tx.wallet) ? tx.wallet : quickWallet;
        const cats = getCategoriesForWallet(w, t);
        if (!tx.category || !cats[tx.category]) return null;
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
            date: /^\d{4}-\d{2}-\d{2}$/.test(tx.date) ? tx.date : new Date().toISOString().split('T')[0],
        };
    };

    const doSave = (tx) => {
        onAddTransaction(tx);
        setSavedList([tx]);
        setPreviewList((items) => items.filter((item) => item.id !== tx.id));
        setExpandedPreviewId(null);
        setText('');
    };

    const doSaveAll = () => {
        const valid = previewList.filter((tx) => Number(tx.amount) > 0 && tx.category);
        if (!valid.length) {
            setError('Belum ada transaksi preview yang valid untuk disimpan.');
            return;
        }
        valid.forEach(onAddTransaction);
        setSavedList(valid);
        setPreviewList([]);
        setExpandedPreviewId(null);
        setText('');
    };

    const getCategoryNames = (wallet, type) => Object.keys(getCategoriesForWallet(wallet, type) || {});
    const getSubCategories = (tx) => getCategoriesForWallet(tx.wallet, tx.type)?.[tx.category]?.subCategories || [];

    const updatePreview = (id, patch) => {
        setPreviewList((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    };

    const changePreviewType = (tx, type) => {
        const categories = getCategoryNames(tx.wallet, type);
        const category = categories.includes(tx.category) ? tx.category : (categories[0] || '');
        const subs = getCategoriesForWallet(tx.wallet, type)?.[category]?.subCategories || [];
        updatePreview(tx.id, { type, category, subCategory: subs.includes(tx.subCategory) ? tx.subCategory : (subs[0] || '') });
    };

    const changePreviewCategory = (tx, category) => {
        const subs = getCategoriesForWallet(tx.wallet, tx.type)?.[category]?.subCategories || [];
        updatePreview(tx.id, { category, subCategory: subs[0] || '' });
    };

    const handleParse = async () => {
        const q = text.trim();
        if (!q || loading) return;
        setError(''); setNotice(''); setSavedList([]); setPreviewList([]); setExpandedPreviewId(null); setLoading(true);
        try {
            const list = await parseTransaction({
                text: q,
                wallets: quickWallets,
                categories: buildCategoriesPayload(),
                defaultWallet: quickWallet,
            });
            if (!list || !list.length) {
                setError('AI kurang yakin (kategori/nominal). Coba lebih jelas, mis. "kopi 15rb pribadi".');
                return;
            }
            const usedLocalFallback = list.some((item) => item?.__localFallback);
            const built = list.map((p) => buildTx(p, q)).filter(Boolean);
            if (!built.length) {
                setError('AI kurang yakin (kategori/nominal). Coba lebih jelas, mis. "kopi 15rb pribadi".');
                return;
            }
            if (usedLocalFallback) {
                setPreviewList(built);
                setNotice('AI sedang gangguan. Ini hasil fallback lokal, cek dompet/kategori dulu sebelum simpan.');
            } else if (autoSave) {
                // Multi-input: save every valid transaction at once.
                built.forEach(onAddTransaction);
                setSavedList(built);
                setText('');
            } else {
                // Autosave OFF -> show every parsed transaction for review.
                setPreviewList(built);
            }
        } catch (e) {
            setError('AI gagal: ' + (e?.message || 'error'));
        } finally {
            setLoading(false);
        }
    };

    // Swipe left/right to close.
    const onTouchStart = (e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchEnd = (e) => {
        const s = touchRef.current; touchRef.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy)) onClose();
    };

    const reset = () => { setSavedList([]); setPreviewList([]); setExpandedPreviewId(null); setError(''); setNotice(''); setText(''); inputRef.current?.focus(); };

    return (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white border-4 border-black pop-shadow animate-slide-up"
            >
                {/* Header */}
                <div className={`${accent} border-b-4 border-black p-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2 text-black">
                        <Sparkles size={22} strokeWidth={2.5} />
                        <h3 className="font-black uppercase tracking-tight">Input Cepat</h3>
                    </div>
                    <button onClick={onClose} className="bg-black text-white p-1 border-2 border-black hover:bg-red-500 transition-colors" aria-label="Tutup">
                        <X size={18} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {showWalletPicker && (
                        <div className="flex items-center gap-2">
                            <span className="bg-black text-white font-black uppercase tracking-widest text-[10px] px-2 py-1 shrink-0">Dompet</span>
                            <div className="grid grid-cols-2 gap-2 flex-1">
                                {availableWallets.map((walletId) => {
                                    const isActive = quickWallet === walletId;
                                    const wallet = WALLETS[walletId] || { label: walletId, color: 'bg-gray-300' };
                                    const Icon = walletId === 'asrama' ? Home : Wallet;

                                    return (
                                        <button
                                            key={walletId}
                                            type="button"
                                            onClick={() => {
                                                setSelectedWallet(walletId);
                                                setPreviewList([]);
                                                setExpandedPreviewId(null);
                                                setSavedList([]);
                                                setError('');
                                                setNotice('');
                                                inputRef.current?.focus();
                                            }}
                                            className={`flex items-center justify-center gap-1.5 border-3 border-black px-2 py-2 font-black uppercase tracking-widest text-[11px] transition-all ${isActive ? `${wallet.color} text-black pop-shadow-sm` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                            aria-pressed={isActive}
                                        >
                                            <Icon size={15} strokeWidth={3} />
                                            {wallet.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleParse(); } }}
                            placeholder={`Cth: "kopi 15rb ${WALLETS[quickWallet]?.label?.toLowerCase() || quickWallet}"`}
                            disabled={loading}
                            autoFocus
                            className="flex-1 min-w-0 bg-yellow-50 border-4 border-black p-3 font-bold focus:outline-none focus:bg-yellow-100 transition-colors disabled:opacity-60"
                        />
                        <button
                            onClick={handleParse}
                            disabled={loading || !text.trim()}
                            className="shrink-0 bg-black text-white font-black uppercase px-4 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center"
                            aria-label="Proses"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} strokeWidth={2.5} />}
                        </button>
                    </div>

                    {/* Auto-save toggle */}
                    <button
                        type="button"
                        onClick={toggleAutoSave}
                        className={`flex items-center gap-2 px-3 py-1.5 border-3 border-black font-black uppercase tracking-wider text-[11px] transition-all ${autoSave ? 'bg-green-400 text-black pop-shadow-sm' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                    >
                        Simpan Otomatis
                        <span className={`w-8 h-4 border-2 border-black relative inline-block transition-all ${autoSave ? 'bg-green-600' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0 w-3 h-3 bg-white border-2 border-black transition-all ${autoSave ? 'left-4' : 'left-0'}`} />
                        </span>
                    </button>

                    {/* Result */}
                    {notice && <p className="bg-yellow-100 border-2 border-black px-2 py-1 text-[11px] font-black text-black">{notice}</p>}
                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    {previewList.length > 0 && (
                        <div className="border-4 border-black bg-gray-50 p-3 space-y-3">
                            {previewList.length > 1 && (
                                <button onClick={doSaveAll} className="w-full bg-black text-white font-black uppercase tracking-widest py-2.5 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-2">
                                    <Check size={18} strokeWidth={3} /> Simpan Semua ({previewList.length})
                                </button>
                            )}

                            <div className="space-y-3">
                                {previewList.map((preview) => {
                                    const isExpanded = expandedPreviewId === preview.id;

                                    return (
                                        <div key={preview.id} className="border-2 border-black bg-white p-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black ${preview.type === 'income' ? 'bg-green-300' : 'bg-red-300'}`}>
                                                    {preview.type === 'income' ? 'Masuk' : 'Keluar'}
                                                </span>
                                                <span className="font-black text-xl tracking-tighter">{formatRupiah(preview.amount)}</span>
                                            </div>
                                            <p className="font-black uppercase tracking-tight">{preview.text}</p>
                                            <p className="text-xs font-bold text-gray-500">
                                                {WALLETS[preview.wallet]?.label || preview.wallet} · {preview.category}{preview.subCategory ? ' › ' + preview.subCategory : ''} · {preview.date}
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() => setExpandedPreviewId(isExpanded ? null : preview.id)}
                                                className="w-full flex items-center justify-between border-2 border-black bg-gray-100 px-3 py-2 font-black uppercase tracking-widest text-[11px] hover:bg-gray-200"
                                                aria-expanded={isExpanded}
                                            >
                                                Edit Detail
                                                <ChevronDown size={16} strokeWidth={3} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isExpanded && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <label className="col-span-2">
                                                        <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Catatan</span>
                                                        <input
                                                            type="text"
                                                            value={preview.text}
                                                            onChange={(e) => updatePreview(preview.id, { text: e.target.value.toUpperCase() })}
                                                            className="w-full border-2 border-black bg-yellow-50 px-2 py-2 font-black uppercase text-sm focus:outline-none focus:bg-yellow-100"
                                                        />
                                                    </label>
                                                    <label>
                                                        <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Nominal</span>
                                                        <input
                                                            type="number"
                                                            inputMode="numeric"
                                                            min="1"
                                                            value={preview.amount}
                                                            onChange={(e) => updatePreview(preview.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                                                            className="w-full border-2 border-black bg-white px-2 py-2 font-black text-sm focus:outline-none focus:bg-yellow-50"
                                                        />
                                                    </label>
                                                    <label>
                                                        <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Jenis</span>
                                                        <select
                                                            value={preview.type}
                                                            onChange={(e) => changePreviewType(preview, e.target.value)}
                                                            className="w-full border-2 border-black bg-white px-2 py-2 font-black uppercase text-sm focus:outline-none focus:bg-yellow-50"
                                                        >
                                                            <option value="expense">Keluar</option>
                                                            <option value="income">Masuk</option>
                                                        </select>
                                                    </label>
                                                    <label className={getSubCategories(preview).length ? '' : 'col-span-2'}>
                                                        <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Kategori</span>
                                                        <select
                                                            value={preview.category}
                                                            onChange={(e) => changePreviewCategory(preview, e.target.value)}
                                                            className="w-full border-2 border-black bg-white px-2 py-2 font-black text-sm focus:outline-none focus:bg-yellow-50"
                                                        >
                                                            {getCategoryNames(preview.wallet, preview.type).map((category) => (
                                                                <option key={category} value={category}>{category}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    {getSubCategories(preview).length > 0 && (
                                                        <label>
                                                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Sub</span>
                                                            <select
                                                                value={preview.subCategory}
                                                                onChange={(e) => updatePreview(preview.id, { subCategory: e.target.value })}
                                                                className="w-full border-2 border-black bg-white px-2 py-2 font-black text-sm focus:outline-none focus:bg-yellow-50"
                                                            >
                                                                {getSubCategories(preview).map((sub) => (
                                                                    <option key={sub} value={sub}>{sub}</option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => doSave(preview)}
                                                disabled={!preview.category || Number(preview.amount) <= 0}
                                                className="w-full bg-black text-white font-black uppercase tracking-widest py-2.5 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Check size={18} strokeWidth={3} /> Simpan Ini
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end">
                                <button onClick={reset} className="bg-white text-black font-black uppercase px-4 py-2 border-4 border-black hover:bg-gray-100 transition-colors" title="Ulangi">
                                    <RotateCcw size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    )}

                    {savedList.length > 0 && (
                        <div className="border-4 border-black bg-green-100 p-3">
                            <p className="font-black uppercase text-green-700 flex items-center gap-2">
                                <Check size={18} strokeWidth={3} /> Tersimpan{savedList.length > 1 ? ` ${savedList.length} transaksi` : ''}!
                            </p>
                            <div className="mt-1 space-y-1">
                                {savedList.map((s) => (
                                    <p key={s.id} className="text-sm font-bold text-gray-700">
                                        {s.type === 'income' ? '+' : '-'}{formatRupiah(s.amount)} · {s.text} ({WALLETS[s.wallet]?.label || s.wallet})
                                    </p>
                                ))}
                            </div>
                            <button onClick={reset} className="mt-3 w-full bg-white text-black font-black uppercase tracking-widest py-2.5 border-4 border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                <Sparkles size={16} strokeWidth={2.5} /> Catat Lagi
                            </button>
                        </div>
                    )}

                    {!previewList.length && !savedList.length && !error && (
                        <p className="text-[11px] font-bold text-gray-400">{autoSave ? 'Simpan otomatis ON — bisa beberapa transaksi sekaligus (pisah koma/baris), langsung tersimpan.' : 'Ketik transaksi pakai bahasa biasa. Geser kiri/kanan atau tap ✕ untuk tutup.'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickInput;
