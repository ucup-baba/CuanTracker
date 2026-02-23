import React from 'react';
import { DollarSign, LogOut, Settings as SettingsIcon, Wallet, Home } from 'lucide-react';
import { WALLETS } from '../constants';

const Header = ({ onLogout, userEmail, onOpenSettings, activeWallet, onWalletChange }) => {
    return (
        <>
            <nav className="bg-yellow-400 border-b-4 border-black py-4 sticky top-0 z-50">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-black text-white p-2 rotate-12 border-2 border-white pop-shadow-sm">
                            <DollarSign size={32} />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Cuan<br />Tracker.</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center gap-2 bg-white text-black font-black uppercase px-6 py-3 border-4 border-black pop-shadow hover:bg-yellow-300 transition-colors"
                            title="Pengaturan Kategori"
                        >
                            <SettingsIcon size={20} />
                        </button>
                        <span className="font-bold uppercase tracking-widest text-sm bg-black text-white px-3 py-1">
                            {userEmail}
                        </span>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 bg-white text-black font-black uppercase px-6 py-3 border-4 border-black pop-shadow hover:bg-red-500 hover:text-white transition-colors"
                        >
                            Keluar <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Wallet Switcher */}
            <div className="bg-white border-b-4 border-black">
                <div className="container mx-auto px-6 flex gap-0">
                    <button
                        onClick={() => onWalletChange('all')}
                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 border-r-4 border-black transition-all ${activeWallet === 'all' ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        <DollarSign size={18} strokeWidth={3} />
                        Semua
                    </button>
                    <button
                        onClick={() => onWalletChange('pribadi')}
                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 border-r-4 border-black transition-all ${activeWallet === 'pribadi' ? 'bg-yellow-400 text-black pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        <Wallet size={18} strokeWidth={3} />
                        💰 Pribadi
                    </button>
                    <button
                        onClick={() => onWalletChange('asrama')}
                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${activeWallet === 'asrama' ? 'bg-indigo-400 text-white pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        <Home size={18} strokeWidth={3} />
                        🏠 Asrama
                    </button>
                </div>
            </div>
        </>
    );
};

export default Header;
