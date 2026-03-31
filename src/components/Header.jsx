import React from 'react';
import { DollarSign, LogOut, Settings as SettingsIcon, Wallet, Home, Calculator as CalcIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WALLETS } from '../constants';

const Header = ({ onLogout, userEmail, onOpenSettings, activeWallet, onWalletChange, onLogoClick, onOpenCalculator, onOpenCashMatch }) => {
    return (
        <>
            <nav className="bg-yellow-400 border-b-4 border-black py-4 sticky top-0 z-50">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <Link to="/" onClick={onLogoClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="bg-black text-white p-2 rotate-12 border-2 border-white pop-shadow-sm">
                            <DollarSign size={32} />
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter">Cuan<br />Tracker.</h1>
                    </Link>
                    <div className="flex items-center gap-2 md:gap-4">
                        <span className="hidden lg:inline-block font-bold uppercase tracking-widest text-sm bg-black text-white px-3 py-1">
                            {userEmail}
                        </span>
                        <button
                            onClick={onOpenCashMatch}
                            className="flex items-center gap-2 bg-yellow-400 text-black font-black uppercase px-3 py-2 md:px-4 md:py-3 border-2 md:border-4 border-black pop-shadow-sm hover:bg-yellow-300 transition-colors"
                            title="Opname Kas"
                        >
                            <DollarSign size={20} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={onOpenCalculator}
                            className="flex items-center gap-2 bg-white text-black font-black uppercase px-3 py-2 md:px-4 md:py-3 border-2 md:border-4 border-black pop-shadow-sm hover:bg-green-300 transition-colors"
                            title="Kalkulator"
                        >
                            <CalcIcon size={20} strokeWidth={2.5} />
                        </button>
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

        </>
    );
};

export default Header;
