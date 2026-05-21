import React from 'react';
import {
    DollarSign, BarChart3, HandCoins, Calculator as CalcIcon,
    LogOut, User, Mail, ChevronRight, Sparkles, Tag, Palette
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import UiSkinToggle from './UiSkinToggle';

const SettingsPage = ({
    userEmail,
    userPhoto,
    userName,
    theme,
    onOpenCashMatch,
    onOpenComparison,
    onOpenDebt,
    onOpenCalculator,
    onOpenKategori,
    onLogout,
}) => {
    const accentBg = theme?.accentPrimary || 'bg-yellow-400';

    const menuItems = [
        {
            id: 'cashMatch',
            label: 'Opname Kas',
            desc: 'Cek & cocokkan saldo',
            icon: DollarSign,
            color: 'bg-yellow-400',
            iconBg: 'bg-yellow-100',
            action: onOpenCashMatch,
        },
        {
            id: 'comparison',
            label: 'Laporan Bulanan',
            desc: 'Perbandingan antar bulan',
            icon: BarChart3,
            color: 'bg-indigo-400',
            iconBg: 'bg-indigo-100',
            action: onOpenComparison,
        },
        {
            id: 'debt',
            label: 'Hutang & Piutang',
            desc: 'Catat & kelola hutang',
            icon: HandCoins,
            color: 'bg-pink-400',
            iconBg: 'bg-pink-100',
            action: onOpenDebt,
        },
        {
            id: 'calculator',
            label: 'Kalkulator',
            desc: 'Hitung cepat',
            icon: CalcIcon,
            color: 'bg-lime-400',
            iconBg: 'bg-lime-100',
            action: onOpenCalculator,
        },
        {
            id: 'kategori',
            label: 'Kategori',
            desc: 'Atur kategori pemasukan & pengeluaran',
            icon: Tag,
            color: 'bg-sky-400',
            iconBg: 'bg-sky-100',
            action: onOpenKategori,
        },
    ];

    return (
        <main className="container mx-auto px-4 sm:px-6 mt-8 mb-28 max-w-lg">
            {/* Profile Card */}
            <div className="bg-white border-4 border-black pop-shadow-sm p-5 mb-8">
                <div className="flex items-center gap-4">
                    {userPhoto ? (
                        <img
                            src={userPhoto}
                            alt="Profile"
                            className="w-16 h-16 border-4 border-black object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className={`w-16 h-16 ${accentBg} border-4 border-black flex items-center justify-center`}>
                            <User size={32} strokeWidth={2.5} className="text-black" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        {userName && (
                            <h2 className="font-black text-lg uppercase tracking-tight truncate">{userName}</h2>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                            <Mail size={14} strokeWidth={2.5} className="text-gray-400 shrink-0" />
                            <span className="text-sm font-bold text-gray-500 truncate">{userEmail}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div className="mb-6">
                <h3 className="font-black uppercase tracking-tighter text-lg flex items-center gap-2 mb-4">
                    <Sparkles size={18} strokeWidth={3} /> Fitur
                </h3>

                <div className="flex flex-col gap-3">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className="flex items-center gap-4 bg-white border-3 border-black p-4 pop-shadow-sm active:translate-y-1 active:shadow-none transition-all text-left w-full group"
                        >
                            <div className={`${item.color} p-3 border-3 border-black shrink-0 group-active:rotate-12 transition-transform`}>
                                <item.icon size={22} strokeWidth={2.5} className="text-black" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black uppercase tracking-tight text-sm">{item.label}</h4>
                                <p className="text-xs text-gray-400 font-bold truncate">{item.desc}</p>
                            </div>
                            <ChevronRight size={20} strokeWidth={2.5} className="text-gray-300 shrink-0 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Appearance */}
            <div className="mb-6">
                <h3 className="font-black uppercase tracking-tighter text-lg flex items-center gap-2 mb-4">
                    <Palette size={18} strokeWidth={3} /> Tampilan
                </h3>
                <div className="flex items-center gap-4 bg-white border-3 border-black p-4 pop-shadow-sm settings-card mb-3">
                    <div className="bg-green-300 p-3 border-3 border-black shrink-0">
                        <Sparkles size={22} strokeWidth={2.5} className="text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black uppercase tracking-tight text-sm">Gaya Tampilan</h4>
                        <p className="text-xs text-gray-400 font-bold truncate">Pilih Pop Classic / Santai Soft</p>
                    </div>
                    <UiSkinToggle />
                </div>
                <div className="flex items-center gap-4 bg-white border-3 border-black p-4 pop-shadow-sm settings-card">
                    <div className="bg-slate-700 p-3 border-3 border-black shrink-0">
                        <Palette size={22} strokeWidth={2.5} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black uppercase tracking-tight text-sm">Mode Gelap</h4>
                        <p className="text-xs text-gray-400 font-bold truncate">Ganti tampilan terang / gelap</p>
                    </div>
                    <ThemeToggle className="px-4 py-3 shrink-0" size={20} />
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 bg-white border-3 border-black p-4 pop-shadow-sm active:translate-y-1 active:shadow-none transition-all hover:bg-red-500 hover:text-white group mt-4"
            >
                <div className="bg-red-400 p-2.5 border-3 border-black group-hover:bg-white transition-colors">
                    <LogOut size={20} strokeWidth={2.5} className="text-white group-hover:text-red-500 transition-colors" />
                </div>
                <span className="font-black uppercase tracking-widest text-sm">Keluar</span>
            </button>
        </main>
    );
};

export default SettingsPage;
