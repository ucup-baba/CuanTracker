import React, { useState, useEffect } from 'react';
import { History, X, CheckCircle, DollarSign, AlertTriangle, Info } from 'lucide-react';
import { formatRupiah } from '../utils';

const CashMatchModal = ({ isOpen, onClose, totalBalance, cashMatches, onAddMatch }) => {
    const [view, setView] = useState('form'); // 'form' | 'history'
    const [cashString, setCashString] = useState('');
    const [cashAmount, setCashAmount] = useState(0);

    // Reset view when opened
    useEffect(() => {
        if (isOpen) {
            setView('form');
            setCashString('');
            setCashAmount(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const diff = cashAmount - totalBalance;
    const isMatched = diff === 0 && cashString !== '';
    const isOver = diff > 0 && cashString !== '';
    const isLess = diff < 0 && cashString !== '';

    const handleSave = () => {
        if (cashString === '') return;

        const newMatch = {
            id: Date.now().toString(),
            date: new Date().toISOString(), // Simpan secara spesifik beserta jamnya
            appBalance: totalBalance,
            cashBalance: cashAmount,
            difference: diff
        };

        onAddMatch(newMatch);
        onClose(); // auto close, or just move to history? let's auto close to signify success.
    };

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black w-full max-w-md pop-shadow transform transition-all translate-y-0">

                {/* Header Modal */}
                <div className="flex items-center justify-between border-b-4 border-black p-4 bg-yellow-400">
                    <h2 className="font-black uppercase text-xl flex items-center gap-2 tracking-tighter">
                        <DollarSign size={24} strokeWidth={3} />
                        Opname Kas
                    </h2>
                    <div className="flex items-center gap-2">
                        {view === 'form' && (
                            <button
                                onClick={() => setView('history')}
                                className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors pop-shadow-sm"
                                title="Riwayat Pencocokan"
                            >
                                <History size={20} />
                            </button>
                        )}
                        {view === 'history' && (
                            <button
                                onClick={() => setView('form')}
                                className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors pop-shadow-sm font-black uppercase text-xs"
                                title="Kembali ke Form"
                            >
                                INPUT BARU
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors pop-shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Pencocokan */}
                {view === 'form' && (
                    <div className="p-6 space-y-6">
                        {/* Info Saldo Aplikasi */}
                        <div className="bg-gray-100 border-4 border-black p-4 text-center pop-shadow-sm rotate-[1deg]">
                            <p className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-1">Saldo di Aplikasi Saat Ini</p>
                            <h3 className="font-black tracking-tighter text-3xl">Rp {formatRupiah(totalBalance)}</h3>
                        </div>

                        {/* Input Saldo Fisik */}
                        <div>
                            <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1 -rotate-[1deg]">
                                Uang Fisik / Tunai yang dipegang (Rp)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl">Rp</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cashString}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                        const num = parseInt(raw, 10) || 0;
                                        // Update states
                                        if (raw === '') {
                                            setCashString('');
                                            setCashAmount(0);
                                        } else {
                                            setCashString(num.toLocaleString('id-ID'));
                                            setCashAmount(num);
                                        }
                                    }}
                                    placeholder="Total uang tunai asli..."
                                    className="w-full bg-yellow-50 border-4 border-black p-4 pl-14 font-bold text-2xl focus:outline-none focus:bg-yellow-100 pop-shadow-sm transition-colors"
                                />
                            </div>
                        </div>

                        {/* Hasil Perbandingan */}
                        {cashString !== '' && (
                            <div className={`p-4 border-4 border-black pop-shadow-sm flex items-start gap-3 transition-all ${isMatched ? 'bg-blue-200' : isOver ? 'bg-green-200' : 'bg-red-200'
                                }`}>
                                <div className="mt-1">
                                    {isMatched ? <CheckCircle size={24} className="text-blue-600" /> : <AlertTriangle size={24} className={isOver ? 'text-green-600' : 'text-red-600'} />}
                                </div>
                                <div>
                                    <p className="font-black uppercase text-lg leading-tight mb-1">
                                        {isMatched && "Pas Mantab! 🎯"}
                                        {isOver && "Wuih, Ada Uang Lebih! 🤑"}
                                        {isLess && "Waduh, Uang Kurang! 💸"}
                                    </p>
                                    <p className="font-bold text-sm text-gray-800">
                                        {isMatched && "Aman Bos, catatan aplikasinya valid sama persis nggak ada yang miss."}
                                        {isOver && `Ada selisih lebih sebesar Rp ${formatRupiah(Math.abs(diff))}. Lupa nyatet pemasukan nih pasti.`}
                                        {isLess && `Ada selisih kurang sebesar Rp ${formatRupiah(Math.abs(diff))}. Bocor kemana tuh duitnya, lupa nyatet pengeluaran ya?`}
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={cashString === ''}
                            className={`w-full font-black uppercase tracking-widest text-xl py-4 border-4 border-black transition-all ${cashString === ''
                                ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-yellow-400 hover:text-black pop-shadow focus:-translate-y-1'
                                }`}
                        >
                            SIMPAN LOG PENGECEKAN
                        </button>
                    </div>
                )}

                {/* Riwayat / History */}
                {view === 'history' && (
                    <div className="p-6 bg-gray-50 h-[400px] overflow-y-auto">
                        <h3 className="font-black uppercase tracking-widest text-sm mb-4 bg-black text-white inline-block px-3 py-1">Riwayat Pengecekan</h3>

                        {cashMatches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-12 text-gray-400 gap-3 border-4 border-black border-dashed bg-white">
                                <Info size={40} />
                                <p className="font-bold">Belum ada riwayat pengecekan saldo, Bos!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cashMatches.map((match) => {
                                    const mDiff = match.difference;
                                    const mIsMatched = mDiff === 0;
                                    const mIsOver = mDiff > 0;

                                    return (
                                        <div key={match.id} className={`border-4 border-black p-4 pop-shadow-sm ${mIsMatched ? 'bg-blue-50' : mIsOver ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2">
                                                <span className="font-bold text-xs uppercase tracking-widest bg-white border-2 border-black px-2 py-0.5">{formatDate(match.date)}</span>
                                                <span className={`font-black text-sm uppercase px-2 py-1 border-2 border-black ${mIsMatched ? 'bg-blue-200' : mIsOver ? 'bg-green-200' : 'bg-red-200'}`}>
                                                    {mIsMatched ? 'PAS' : mIsOver ? 'LEBIH' : 'KURANG'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold mb-1">
                                                <span className="text-gray-500">Saldo Fisik:</span>
                                                <span>Rp {formatRupiah(match.cashBalance)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold mb-2">
                                                <span className="text-gray-500">Aplikasi:</span>
                                                <span>Rp {formatRupiah(match.appBalance)}</span>
                                            </div>

                                            {!mIsMatched && (
                                                <div className="mt-2 pt-2 border-t-2 border-black flex justify-between font-black text-base">
                                                    <span>Selisih:</span>
                                                    <span className={mIsOver ? 'text-green-600' : 'text-red-600'}>
                                                        {mIsOver ? '+' : '-'} Rp {formatRupiah(Math.abs(mDiff))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashMatchModal;
