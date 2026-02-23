import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Home } from 'lucide-react';
import { formatRupiah } from '../utils';
import { WALLETS } from '../constants';

const BalanceCards = ({ totalBalance, totalIncome, totalExpense, activeWallet, onToggleSummary, activeSummary }) => {
    const walletLabel = activeWallet === 'all'
        ? 'Total Semua'
        : activeWallet === 'asrama'
            ? 'Asrama'
            : 'Pribadi';

    const heroColor = activeWallet === 'asrama' ? 'bg-indigo-500' : activeWallet === 'pribadi' ? 'bg-blue-500' : 'bg-blue-500';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Saldo Utama */}
            <div className={`md:col-span-3 ${heroColor} border-4 border-black p-8 md:p-12 pop-shadow relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest bg-white inline-block px-4 py-2 border-2 border-black mb-4 pop-shadow-sm">
                            Sisa Amunisi — {walletLabel}
                        </h2>
                        <p className={`text-5xl md:text-7xl font-black uppercase tracking-tighter ${totalBalance < 0 ? 'text-red-300' : 'text-white'} border-text drop-shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
                            {formatRupiah(totalBalance)}
                        </p>
                    </div>
                    {activeWallet === 'asrama' ? (
                        <Home size={120} className="absolute right-[-20px] bottom-[-20px] text-white opacity-20 rotate-[-15deg]" />
                    ) : (
                        <Wallet size={120} className="absolute right-[-20px] bottom-[-20px] text-white opacity-20 rotate-[-15deg]" />
                    )}
                </div>
            </div>

            {/* Total Pemasukan */}
            <div
                onClick={() => onToggleSummary?.('income')}
                className={`bg-green-400 border-4 border-black p-6 flex flex-col justify-between cursor-pointer transition-transform hover:-translate-y-2 ${activeSummary === 'income' ? 'pop-shadow-sm ring-4 ring-black ring-offset-4 ring-offset-pink-100' : 'pop-shadow'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black uppercase tracking-widest text-lg bg-white px-3 py-1 border-2 border-black">Panen Cuan</h3>
                    <div className="bg-black text-white p-2 rounded-full"><TrendingUp size={24} /></div>
                </div>
                <p className="text-3xl md:text-4xl font-black tracking-tighter truncate">{formatRupiah(totalIncome)}</p>
            </div>

            {/* Total Pengeluaran */}
            <div
                onClick={() => onToggleSummary?.('expense')}
                className={`bg-red-400 border-4 border-black p-6 flex flex-col justify-between md:col-span-2 cursor-pointer transition-transform hover:-translate-y-2 ${activeSummary === 'expense' ? 'pop-shadow-sm ring-4 ring-black ring-offset-4 ring-offset-pink-100' : 'pop-shadow'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black uppercase tracking-widest text-lg bg-black text-white px-3 py-1 border-2 border-transparent">Dompet Jebol</h3>
                    <div className="bg-white text-black p-2 rounded-full border-2 border-black"><TrendingDown size={24} /></div>
                </div>
                <p className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)] truncate">{formatRupiah(totalExpense)}</p>
            </div>
        </div>
    );
};

export default BalanceCards;
