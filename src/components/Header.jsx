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
                        <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter">Cuan<br />Tracker.</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <span className="hidden lg:inline-block font-bold uppercase tracking-widest text-sm bg-black text-white px-3 py-1">
                            {userEmail}
                        </span>
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center gap-2 bg-white text-black font-black uppercase px-3 py-2 md:px-6 md:py-3 border-2 md:border-4 border-black pop-shadow-sm hover:bg-yellow-300 transition-colors"
                            title="Pengaturan"
                        >
                            <SettingsIcon size={20} />
                            <span className="hidden md:inline">Pengaturan</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 bg-white text-black font-black uppercase px-3 py-2 md:px-6 md:py-3 border-2 md:border-4 border-black pop-shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                            title="Keluar"
                        >
                            <LogOut size={20} className="md:order-last" />
                            <span className="hidden md:inline">Keluar</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Wallet Switcher */}
            <div className="bg-white border-b-4 border-black">
                <div className="container mx-auto px-6 flex gap-0">
                    <button
                        onClick={() => onWalletChange('all')}
                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 border-r-4 border-black transition-all ${activeWallet === 'all' ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        <span className={`p-1.5 border-3 ${activeWallet === 'all' ? 'border-white bg-white text-black' : 'border-gray-300 bg-white text-gray-400'}`}>
                            <DollarSign size={18} strokeWidth={3} />
                        </span>
                        Semua
                    </button>
                    <button
                        onClick={() => onWalletChange('pribadi')}
                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 border-r-4 border-black transition-all ${activeWallet === 'pribadi' ? 'bg-yellow-400 text-black pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        <span className={`p-1.5 border-3 ${activeWallet === 'pribadi' ? 'border-black bg-white text-yellow-600' : 'border-gray-300 bg-white text-gray-400'}`}>
                            <Wallet size={18} strokeWidth={3} />
                        </span>
                        Pribadi
                    </button>
                    <button
                        onClick={() => onWalletChange('asrama')}
                        className={`flex-1 py-3 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${activeWallet === 'asrama' ? 'bg-indigo-400 text-white pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        <span className={`p-1.5 border-3 ${activeWallet === 'asrama' ? 'border-black bg-white text-indigo-600' : 'border-gray-300 bg-white text-gray-400'}`}>
                            <Home size={18} strokeWidth={3} />
                        </span>
                        Asrama
                    </button>
                </div>
            </div>
        </>
    );
};

export default Header;
