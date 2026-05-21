import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { financeChat } from '../ai/aiClient';
import { buildFinanceSummary } from '../ai/financeSummary';

const FAB_SIZE = 56;
const POS_KEY = 'cuan-fab-pos';

function loadPos() {
    try {
        const p = JSON.parse(localStorage.getItem(POS_KEY));
        if (p && typeof p.top === 'number' && (p.side === 'left' || p.side === 'right')) return p;
    } catch { /* ignore */ }
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return { side: 'right', top: Math.round(h * 0.62) };
}

const GREETING = 'Hai! Aku Asisten Cuan 🤖. Tanya apa aja soal keuanganmu — misal "bulan ini boros di mana?" atau "gimana cara hemat?". Aku jawab berdasarkan datamu.';

const AiAssistant = ({ transactions = [], userRole, theme, walletFilter = null, scopeLabel = null, onAddTransaction, getCategoriesForWallet, availableWallets = [], defaultWallet = 'pribadi' }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(loadPos);
    const [drag, setDrag] = useState(null); // live {x,y} while dragging
    const dragInfo = useRef(null);

    const [messages, setMessages] = useState([{ role: 'model', text: GREETING }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [canRecord, setCanRecord] = useState(() => {
        try { return localStorage.getItem('cuan-ai-record') === '1'; } catch { return false; }
    });
    const scrollRef = useRef(null);

    const accent = theme?.accentPrimary || 'bg-yellow-400';

    const toggleRecord = () => setCanRecord((v) => {
        const nv = !v;
        try { localStorage.setItem('cuan-ai-record', nv ? '1' : '0'); } catch { /* ignore */ }
        return nv;
    });

    // Compact categories payload {wallet: {type: {cat:[subs]}}} so the model can
    // pick valid category/subCategory when recording.
    const buildCats = () => {
        const mapCats = (obj) => Object.fromEntries(
            Object.entries(obj || {}).map(([c, d]) => [c, d?.subCategories || []])
        );
        const out = {};
        for (const w of availableWallets) {
            out[w] = {
                expense: mapCats(getCategoriesForWallet?.(w, 'expense')),
                income: mapCats(getCategoriesForWallet?.(w, 'income')),
            };
        }
        return out;
    };

    // Validate + persist transactions the model wants to record. Returns the saved ones.
    const applyRecorded = (txs) => {
        const saved = [];
        for (const tx of txs || []) {
            if (!tx || tx.type === 'transfer') continue;
            const t = tx.type === 'income' ? 'income' : 'expense';
            const w = availableWallets.includes(tx.wallet) ? tx.wallet : defaultWallet;
            const cats = getCategoriesForWallet ? getCategoriesForWallet(w, t) : {};
            if (!tx.category || !cats[tx.category]) continue;
            const subs = cats[tx.category].subCategories || [];
            let sub = tx.subCategory;
            if (subs.length) { if (!subs.includes(sub)) sub = subs[0]; } else { sub = sub || ''; }
            const amount = Number(tx.amount) || 0;
            if (!amount || amount <= 0) continue;
            const final = {
                id: Math.floor(Math.random() * 100000000),
                text: tx.text || 'Transaksi',
                amount,
                type: t,
                wallet: w,
                category: tx.category,
                subCategory: sub,
                date: tx.date || new Date().toISOString().split('T')[0],
            };
            onAddTransaction && onAddTransaction(final);
            saved.push(final);
        }
        return saved;
    };

    useEffect(() => {
        if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open, loading]);

    // --- Draggable FAB (pointer events, snaps to nearest edge) ---
    const onPointerDown = (e) => {
        dragInfo.current = { startX: e.clientX, startY: e.clientY, moved: false };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
        const di = dragInfo.current;
        if (!di) return;
        if (Math.abs(e.clientX - di.startX) > 6 || Math.abs(e.clientY - di.startY) > 6) di.moved = true;
        if (di.moved) setDrag({ x: e.clientX, y: e.clientY });
    };
    const onPointerUp = (e) => {
        const di = dragInfo.current;
        dragInfo.current = null;
        if (!di) return;
        if (!di.moved) { setDrag(null); setOpen((o) => !o); return; } // tap = toggle
        const side = e.clientX < window.innerWidth / 2 ? 'left' : 'right';
        const top = Math.min(Math.max(e.clientY - FAB_SIZE / 2, 70), window.innerHeight - 90);
        const np = { side, top };
        setPos(np);
        setDrag(null);
        try { localStorage.setItem(POS_KEY, JSON.stringify(np)); } catch { /* ignore */ }
    };

    const fabStyle = drag
        ? { left: drag.x - FAB_SIZE / 2, top: drag.y - FAB_SIZE / 2, right: 'auto' }
        : pos.side === 'left'
            ? { left: 12, top: pos.top }
            : { right: 12, top: pos.top };

    const send = async () => {
        const q = input.trim();
        if (!q || loading) return;
        const history = messages.filter((m) => m.text !== GREETING).slice(-6);
        setMessages((m) => [...m, { role: 'user', text: q }]);
        setInput('');
        setLoading(true);
        try {
            const summary = buildFinanceSummary(transactions, { walletFilter, scopeLabel });
            const result = await financeChat({
                question: q,
                summary,
                history,
                canRecord,
                categories: canRecord ? buildCats() : undefined,
                wallets: availableWallets,
                defaultWallet,
            });
            setMessages((m) => [...m, { role: 'model', text: result.answer || '(kosong)' }]);
            if (canRecord && Array.isArray(result.transactions) && result.transactions.length) {
                const saved = applyRecorded(result.transactions);
                if (saved.length) {
                    const list = saved
                        .map((s) => `• ${s.type === 'income' ? 'Masuk' : 'Keluar'}: ${s.text} — Rp${s.amount.toLocaleString('id-ID')} (${s.category}${s.subCategory ? ' › ' + s.subCategory : ''})`)
                        .join('\n');
                    setMessages((m) => [...m, { role: 'model', text: `✅ Dicatat ${saved.length} transaksi:\n${list}` }]);
                }
            }
        } catch (e) {
            setMessages((m) => [...m, { role: 'model', text: 'Maaf, lagi gangguan: ' + (e?.message || 'error') }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                aria-label="Asisten Cuan"
                title="Asisten Cuan (geser untuk pindah)"
                style={{ position: 'fixed', width: FAB_SIZE, height: FAB_SIZE, zIndex: 55, touchAction: 'none', ...fabStyle }}
                className={`${accent} text-black border-4 border-black pop-shadow-sm flex items-center justify-center active:scale-95 transition-transform`}
            >
                <Bot size={26} strokeWidth={2.5} />
            </button>

            {/* Chat panel */}
            {open && (
                <div className="fixed z-[80] inset-x-3 bottom-[88px] sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-[380px] max-h-[75vh] bg-white border-4 border-black pop-shadow flex flex-col">
                    {/* Header */}
                    <div className={`${accent} border-b-4 border-black p-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2 text-black">
                            <Bot size={22} strokeWidth={2.5} />
                            <h3 className="font-black uppercase tracking-tight">Asisten Cuan</h3>
                        </div>
                        <button onClick={() => setOpen(false)} className="bg-black text-white p-1 border-2 border-black hover:bg-red-500 transition-colors" aria-label="Tutup">
                            <X size={18} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] border-3 border-black p-2.5 text-sm font-medium whitespace-pre-wrap break-words ${m.role === 'user' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border-3 border-black p-2.5 flex items-center gap-2 text-sm font-bold">
                                    <Loader2 size={16} className="animate-spin" /> Mikir...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Record toggle + input */}
                    <div className="border-t-4 border-black p-2 bg-white space-y-2">
                        <button
                            type="button"
                            onClick={toggleRecord}
                            className={`flex items-center gap-2 px-2.5 py-1 border-3 border-black font-black uppercase tracking-wider text-[10px] transition-all ${canRecord ? 'bg-green-400 text-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                            title="Kalau ON, asisten boleh langsung mencatat transaksi dari obrolan"
                        >
                            Boleh Catat Transaksi
                            <span className={`w-7 h-3.5 border-2 border-black relative inline-block transition-all ${canRecord ? 'bg-green-600' : 'bg-gray-300'}`}>
                                <span className={`absolute -top-px w-2.5 h-2.5 bg-white border-2 border-black transition-all ${canRecord ? 'left-3.5' : 'left-0'}`} />
                            </span>
                        </button>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
                                placeholder={canRecord ? 'Tanya / suruh catat transaksi...' : 'Tanya soal keuanganmu...'}
                                disabled={loading}
                                className="flex-1 min-w-0 bg-gray-100 border-3 border-black p-2.5 text-sm font-bold focus:outline-none focus:bg-yellow-100 transition-colors disabled:opacity-60"
                            />
                            <button
                                onClick={send}
                                disabled={loading || !input.trim()}
                                className="shrink-0 bg-black text-white px-3 border-3 border-black hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center"
                                aria-label="Kirim"
                            >
                                <Send size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiAssistant;
