import React, { useState } from 'react';
import { DollarSign, LogOut, Settings as SettingsIcon, Wallet, Home, Calculator as CalcIcon, BarChart3, Menu, X, HandCoins, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WALLETS } from '../constants';

const Header = ({ onLogout, userEmail, onOpenSettings, activeWallet, onWalletChange, onLogoClick, onOpenCalculator, onOpenCashMatch, onOpenComparison, onOpenDebt, isPengurus, theme, onOpenAccountManager, onOpenPengurusComparison, pendingCount = 0 }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    const headerBg = theme?.headerBg || 'bg-yellow-400';
    const headerTextClass = headerBg.includes('emerald') || headerBg.includes('rose') ? 'text-white' : 'text-black';

    return (
        <>
            <nav className={`${headerBg} border-b-4 border-black py-4 sticky top-0 z-50`}>
                <div className="container mx-auto px-6 flex justify-between items-center relative">
                    <Link to="/" onClick={() => { if (onLogoClick) onLogoClick(); closeMenu(); }} className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${headerTextClass}`}>
                        <div className={`${isPengurus ? 'bg-white text-emerald-600' : 'bg-black text-white'} p-2 rotate-12 border-2 ${isPengurus ? 'border-emerald-600' : 'border-white'} pop-shadow-sm`}>
                            {isPengurus ? <Shield size={32} /> : <DollarSign size={32} />}
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter">
                            {isPengurus ? <>Dashboard<br />Pengurus.</> : <>Cuan<br />Tracker.</>}
                        </h1>
                    </Link>

                    {/* Tombol Menu Mobile */}
                    <button
                        className={`md:hidden bg-white text-black p-2 border-2 border-black pop-shadow-sm hover:bg-gray-100 transition-colors`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        title="Tampilkan Menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Menu Desktop */}
                    <div className="hidden md:flex flex-row items-center gap-4">
                        <span className={`font-bold uppercase tracking-widest text-sm ${isPengurus ? 'bg-emerald-800 text-white' : 'bg-black text-white'} px-3 py-1`}>
                            {userEmail}
                        </span>

                        {!isPengurus && (
                            <>
                                <button
                                    onClick={onOpenCashMatch}
                                    className="flex items-center gap-2 bg-yellow-400 text-black font-black uppercase px-4 py-3 border-4 border-black pop-shadow-sm hover:bg-yellow-300 transition-colors"
                                    title="Opname Kas"
                                >
                                    <DollarSign size={20} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={onOpenComparison}
                                    className="flex items-center gap-2 bg-indigo-100 text-black font-black uppercase px-4 py-3 border-4 border-black pop-shadow-sm hover:bg-indigo-300 transition-colors"
                                    title="Perbandingan Bulanan"
                                >
                                    <BarChart3 size={20} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={onOpenDebt}
                                    className="flex items-center gap-2 bg-[#ff90e8] text-black font-black uppercase px-4 py-3 border-4 border-black pop-shadow-sm hover:bg-pink-400 transition-colors"
                                    title="Utang & Piutang"
                                >
                                    <HandCoins size={20} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={onOpenCalculator}
                                    className="flex items-center gap-2 bg-white text-black font-black uppercase px-4 py-3 border-4 border-black pop-shadow-sm hover:bg-green-300 transition-colors"
                                    title="Kalkulator"
                                >
                                    <CalcIcon size={20} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={onOpenSettings}
                                    className="flex items-center gap-2 bg-white text-black font-black uppercase px-6 py-3 border-4 border-black pop-shadow-sm hover:bg-yellow-300 transition-colors"
                                    title="Pengaturan"
                                >
                                    <SettingsIcon size={20} />
                                    <span>Pengaturan</span>
                                </button>
                            </>
                        )}

                        {isPengurus && onOpenPengurusComparison && (
                            <button
                                onClick={onOpenPengurusComparison}
                                className="flex items-center gap-2 bg-white text-blue-700 font-black uppercase px-4 py-3 border-4 border-black pop-shadow-sm hover:bg-blue-100 transition-colors"
                                title="Perbandingan"
                            >
                                <BarChart3 size={20} strokeWidth={2.5} />
                                <span className="hidden lg:inline">Perbandingan</span>
                            </button>
                        )}

                        {isPengurus && onOpenAccountManager && (
                            <button
                                onClick={onOpenAccountManager}
                                className="relative flex items-center gap-2 bg-white text-emerald-700 font-black uppercase px-4 py-3 border-4 border-black pop-shadow-sm hover:bg-emerald-100 transition-colors"
                                title="Kelola Akun"
                            >
                                <Users size={20} strokeWidth={2.5} />
                                <span>Akun</span>
                                {pendingCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 border-2 border-black animate-bounce">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 bg-white text-black font-black uppercase px-6 py-3 border-4 border-black pop-shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                            title="Keluar"
                        >
                            <LogOut size={20} className="order-last" />
                            <span>Keluar</span>
                        </button>
                    </div>

                    {/* Dropdown Menu Mobile */}
                    {isMenuOpen && (
                        <div className={`absolute top-[100%] left-0 right-0 ${headerBg} border-b-4 border-black p-4 flex flex-col gap-3 md:hidden z-50 border-t-4 mt-4 shadow-xl`}>
                            <span className={`font-bold uppercase tracking-widest text-sm ${isPengurus ? 'bg-emerald-800' : 'bg-black'} text-white px-3 py-2 text-center`}>
                                {userEmail}
                            </span>

                            {!isPengurus && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { onOpenCashMatch(); closeMenu(); }}
                                            className="flex items-center justify-center gap-2 bg-white text-black font-black uppercase px-3 py-3 border-2 border-black pop-shadow-sm hover:bg-yellow-300 transition-colors"
                                        >
                                            <DollarSign size={18} strokeWidth={2.5} /> Kas
                                        </button>
                                        <button
                                            onClick={() => { onOpenComparison(); closeMenu(); }}
                                            className="flex items-center justify-center gap-2 bg-indigo-100 text-black font-black uppercase px-3 py-3 border-2 border-black pop-shadow-sm hover:bg-indigo-300 transition-colors"
                                        >
                                            <BarChart3 size={18} strokeWidth={2.5} /> Chart
                                        </button>
                                        <button
                                            onClick={() => { onOpenDebt(); closeMenu(); }}
                                            className="flex items-center justify-center col-span-2 gap-2 bg-[#ff90e8] text-black font-black uppercase px-3 py-3 border-2 border-black pop-shadow-sm hover:bg-pink-400 transition-colors"
                                        >
                                            <HandCoins size={18} strokeWidth={2.5} /> Utang & Piutang
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { onOpenCalculator(); closeMenu(); }}
                                        className="flex items-center justify-center gap-2 bg-white text-black font-black uppercase px-4 py-3 border-2 border-black pop-shadow-sm hover:bg-green-300 transition-colors"
                                    >
                                        <CalcIcon size={20} strokeWidth={2.5} /> Kalkulator
                                    </button>
                                    <button
                                        onClick={() => { onOpenSettings(); closeMenu(); }}
                                        className="flex items-center justify-center gap-2 bg-white text-black font-black uppercase px-4 py-3 border-2 border-black pop-shadow-sm hover:bg-yellow-300 transition-colors"
                                    >
                                        <SettingsIcon size={20} /> Pengaturan
                                    </button>
                                </>
                            )}

                            {isPengurus && onOpenPengurusComparison && (
                                <button
                                    onClick={() => { onOpenPengurusComparison(); closeMenu(); }}
                                    className="flex items-center justify-center gap-2 bg-white text-blue-700 font-black uppercase px-4 py-3 border-2 border-black pop-shadow-sm hover:bg-blue-100 transition-colors"
                                >
                                    <BarChart3 size={20} strokeWidth={2.5} />
                                    Perbandingan
                                </button>
                            )}

                            {isPengurus && onOpenAccountManager && (
                                <button
                                    onClick={() => { onOpenAccountManager(); closeMenu(); }}
                                    className="relative flex items-center justify-center gap-2 bg-white text-emerald-700 font-black uppercase px-4 py-3 border-2 border-black pop-shadow-sm hover:bg-emerald-100 transition-colors"
                                >
                                    <Users size={20} strokeWidth={2.5} />
                                    Kelola Akun
                                    {pendingCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 border-2 border-black animate-bounce">
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => { onLogout(); closeMenu(); }}
                                className="flex items-center justify-center gap-2 bg-white text-black font-black uppercase px-4 py-3 border-2 border-black pop-shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <LogOut size={20} /> Keluar
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Header;
