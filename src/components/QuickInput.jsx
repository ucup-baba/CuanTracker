import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, RotateCcw } from 'lucide-react';
import { parseTransaction, parseAmountId } from '../ai/aiClient';
import { formatRupiah } from '../utils';
import { WALLETS } from '../constants';

// Quick AI transaction input as an overlay panel (opened from the bottom nav).
// Appears like the assistant: X to close (top-right), swipe left/right to close.
const QuickInput = ({ isOpen, onClose, getCategoriesForWallet, availableWallets = [], activeWallet, onAddTransaction, theme }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null); // candidate tx awaiting confirm
    const [savedList, setSavedList] = useState([]); // saved tx(s) (success)
    const [autoSave, setAutoSave] = useState(() => {
        try { return localStorage.getItem('cuan-nl-autosave') === '1'; } catch { return false; }
    });
    const touchRef = useRef(null);
    const inputRef = useRef(null);

    const accent = theme?.accentPrimary || 'bg-yellow-400';

    // Reset state whenever the panel is closed.
    useEffect(() => {
        if (!isOpen) {
            setText(''); setError(''); setPreview(null); setSavedList([]); setLoading(false);
        }
    }, [isOpen]);

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
        for (const w of availableWallets) {
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
        const w = availableWallets.includes(tx.wallet) ? tx.wallet : (activeWallet && activeWallet !== 'all' ? activeWallet : (availableWallets[0] || 'pribadi'));
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
        setPreview(null);
        setText('');
    };

    const handleParse = async () => {
        const q = text.trim();
        if (!q || loading) return;
        setError(''); setSavedList([]); setPreview(null); setLoading(true);
        try {
            const list = await parseTransaction({
                text: q,
                wallets: availableWallets,
                categories: buildCategoriesPayload(),
                defaultWallet: activeWallet && activeWallet !== 'all' ? activeWallet : (availableWallets[0] || 'pribadi'),
            });
            if (!list || !list.length) {
                setError('AI kurang yakin (kategori/nominal). Coba lebih jelas, mis. "kopi 15rb pribadi".');
                return;
            }
            if (autoSave) {
                // Multi-input: save every valid transaction at once.
                const saved = [];
                for (const p of list) { const tx = buildTx(p, q); if (tx) { onAddTransaction(tx); saved.push(tx); } }
                if (saved.length) { setSavedList(saved); setText(''); }
                else setError('AI kurang yakin (kategori/nominal). Coba lebih jelas, mis. "kopi 15rb pribadi".');
            } else {
                // Autosave OFF -> single preview (first).
                const tx = buildTx(list[0], q);
                if (!tx) {
                    setError('AI kurang yakin (kategori/nominal). Coba lebih jelas, mis. "kopi 15rb pribadi".');
                    return;
                }
                setPreview(tx);
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

    const reset = () => { setSavedList([]); setPreview(null); setError(''); setText(''); inputRef.current?.focus(); };

    return (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                className="w-full sm:max-w-md bg-white border-4 border-black pop-shadow animate-slide-up"
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
                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleParse(); } }}
                            placeholder='Cth: "kopi 15rb pribadi"'
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
                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    {preview && (
                        <div className="border-4 border-black bg-gray-50 p-3 space-y-2">
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
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => doSave(preview)} className="flex-1 bg-black text-white font-black uppercase tracking-widest py-3 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-2">
                                    <Check size={18} strokeWidth={3} /> Simpan
                                </button>
                                <button onClick={reset} className="bg-white text-black font-black uppercase px-4 border-4 border-black hover:bg-gray-100 transition-colors" title="Ulangi">
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

                    {!preview && !savedList.length && !error && (
                        <p className="text-[11px] font-bold text-gray-400">{autoSave ? 'Simpan otomatis ON — bisa beberapa transaksi sekaligus (pisah koma/baris), langsung tersimpan.' : 'Ketik transaksi pakai bahasa biasa. Geser kiri/kanan atau tap ✕ untuk tutup.'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickInput;
