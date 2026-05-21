import React from 'react';
import { DollarSign, LogOut, Tag, Wallet, Home, Calculator as CalcIcon, BarChart3, User, X, HandCoins, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WALLETS } from '../constants';
import ThemeToggle from './ThemeToggle';

const Header = ({ onLogout, userEmail, userPhoto, onOpenSettings, activeWallet, onWalletChange, onLogoClick, onOpenCalculator, onOpenCashMatch, onOpenComparison, onOpenDebt, isPengurus, theme, onOpenAccountManager, onOpenPengurusComparison, pendingCount = 0 }) => {
    const headerBg = theme?.headerBg || 'bg-yellow-400';
    // Emerald/rose headers need white text. For the light (yellow/amber) headers we
    // leave the color unset and inherit from the <nav>: black in light mode, and the
    // accent-ink dark in dark mode (see index.css). Using an explicit `text-black`
    // here would get flipped to light by the dark skin and wash out the logo.
    const headerTextClass = headerBg.includes('emerald') || headerBg.includes('rose') ? 'text-white' : '';

    return (
        <>
            <nav className={`${headerBg} border-b-4 border-black py-4 sticky top-0 z-50 app-header`}>
                <div className="container mx-auto px-6 flex justify-between items-center relative">
                    <Link to="/" onClick={() => { if (onLogoClick) onLogoClick(); }} className={`flex items-center gap-3 hover:opacity-80 transition-opacity app-brand ${headerTextClass}`}>
                        <div className={`${isPengurus ? 'bg-white text-emerald-600' : 'bg-black text-white'} p-2 rotate-12 border-2 ${isPengurus ? 'border-emerald-600' : 'border-white'} pop-shadow-sm app-logo-mark`}>
                            {isPengurus ? <Shield size={32} /> : <DollarSign size={32} />}
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter app-brand-title">
                            {isPengurus ? <>Dashboard<br />Pengurus.</> : <>Cuan<br />Tracker.</>}
                        </h1>
                    </Link>

                    {/* Mobile: Theme Toggle + Profile Icon */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle className="w-10 h-10 border-[3px]" size={20} />
                        <Link
                            to="/setting"
                            title="Profil & Setting"
                        >
                            {userPhoto ? (
                                <img
                                    src={userPhoto}
                                    alt="Profile"
                                    className="w-10 h-10 border-[3px] border-black object-cover pop-shadow-sm"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="bg-white text-black p-2 border-[3px] border-black pop-shadow-sm">
                                    <User size={22} strokeWidth={2.5} />
                                </div>
                            )}
                        </Link>
                    </div>

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
                                    title="Kategori"
                                >
                                    <Tag size={20} />
                                    <span>Kategori</span>
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

                        <ThemeToggle className="px-4 py-3" size={20} />

                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 bg-white text-black font-black uppercase px-6 py-3 border-4 border-black pop-shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                            title="Keluar"
                        >
                            <LogOut size={20} className="order-last" />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Header;
